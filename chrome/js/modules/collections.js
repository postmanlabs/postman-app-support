pm.collections = {
    areLoaded:false,
    items:[],

    originalCollectionId: "",
    toBeImportedCollection:{},

    init:function () {
        this.addCollectionListeners();
        pm.collections.drive.registerHandlers();
    },

    addCollectionListeners:function () {
        var $collection_items = $('#collection-items');
        $collection_items.on("mouseenter", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'block');
        });

        $collection_items.on("mouseleave", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("click", ".sidebar-collection-head-name", function () {
            var id = $(this).attr('data-id');
            pm.collections.toggleRequestList(id);
        });

        $collection_items.on("click", ".collection-head-actions .label", function () {
            var id = $(this).parent().parent().parent().attr('data-id');
            pm.collections.toggleRequestList(id);
        });

        $collection_items.on("click", ".request-actions-load", function () {
            var id = $(this).attr('data-id');
            pm.collections.getCollectionRequest(id);
        });


        $collection_items.on("click", ".request-actions-delete", function () {
            var id = $(this).attr('data-id');

            pm.indexedDB.getCollectionRequest(id, function (req) {
                $('#modal-delete-collection-request-yes').attr('data-id', id);
                $('#modal-delete-collection-request-name').html(req.name);
                $('#modal-delete-collection-request').modal('show');
            });            
        });        

        $collection_items.on("click", ".request-actions-edit", function () {
            var id = $(this).attr('data-id');
            $('#form-edit-collection-request .collection-request-id').val(id);

            pm.indexedDB.getCollectionRequest(id, function (req) {
                $('#form-edit-collection-request .collection-request-name').val(req.name);
                $('#form-edit-collection-request .collection-request-description').val(req.description);
                $('#modal-edit-collection-request').modal('show');
            });
        });

        $collection_items.on("click", ".collection-actions-edit", function () {
            var id = $(this).attr('data-id');
            pm.indexedDB.getCollection(id, function (collection) {                
                $('#form-edit-collection .collection-id').val(collection.id);
                $('#form-edit-collection .collection-name').val(collection.name);
                
                if (pm.settings.getSetting("driveSyncEnabled") === true) {
                    $('#edit-collection-drive').css("display", "block");
                    $('#edit-collection-update-drive').attr("data-collection-id", id);                

                    pm.collections.drive.checkIfCollectionIsOnDrive(id, function(exists, driveFile) {
                        if (exists) {
                            console.log(driveFile.file.modifiedDate);
                            var modifiedDate = new Date(driveFile.file.modifiedDate);
                            var t = jQuery.timeago(modifiedDate);
                            $('#edit-collection-drive-status').html("Last synced " + t);                            
                            $('#edit-collection-upload-drive').css("display", "none");
                        }
                        else {
                            $('#edit-collection-upload-drive').css("display", "inline-block");                        
                        }
                    });    
                }
                else {
                    $('#edit-collection-drive').css("display", "none");
                }
                

                $('#modal-edit-collection').modal('show');
            });            
        });

        $collection_items.on("click", ".collection-actions-delete", function () {
            var id = $(this).attr('data-id');
            var name = $(this).attr('data-name');

            pm.indexedDB.getCollection(id, function (collection) {
                $('#modal-delete-collection-yes').attr('data-id', id);
                $('#modal-delete-collection-name').html(collection.name);
            });            
        });

        $('#modal-overwrite-collection-overwrite').on("click", function () {            
            pm.collections.overwriteCollection(pm.collections.originalCollectionId, pm.collections.toBeImportedCollection);
        });        

        $('#modal-overwrite-collection-duplicate').on("click", function () {            
            pm.collections.duplicateCollection(pm.collections.toBeImportedCollection);
        });

        $('#modal-delete-collection-yes').on("click", function () {
            var id = $(this).attr('data-id');
            pm.collections.deleteCollection(id, true);
        });

        $('#modal-delete-collection-request-yes').on("click", function () {
            var id = $(this).attr('data-id');
            pm.collections.deleteCollectionRequest(id);
        });

        $('#import-collection-url-submit').on("click", function () {
            var url = $('#import-collection-url-input').val();
            pm.collections.importCollectionFromUrl(url);
        });

        $('#edit-collection-update-drive').on("click", function() {
            var id = $(this).attr('data-collection-id');
            console.log("Run change queue");
            pm.drive.fetchChanges();
        });

        $collection_items.on("click", ".collection-actions-download", function () {
            var id = $(this).attr('data-id');            

            $("#modal-share-collection").modal("show");            

            $('#share-collection-get-link').attr("data-collection-id", id);
            $('#share-collection-download').attr("data-collection-id", id);
            $('#share-collection-link').css("display", "none");
        });

        $('#share-collection-get-link').on("click", function () {
            var id = $(this).attr('data-collection-id');
            pm.collections.uploadCollection(id, function (link) {
                $('#share-collection-link').css("display", "block");
                $('#share-collection-link').html(link);
            });
        });

        $('#share-collection-download').on("click", function () {
            var id = $(this).attr('data-collection-id');
            pm.collections.saveCollection(id);
        });

        $('#request-samples').on("click", ".sample-response-name", function () {
            var id = $(this).attr("data-id");
            pm.collections.loadResponseInEditor(id);
        });

        $('#request-samples').on("click", ".sample-response-delete", function () {
            var id = $(this).attr("data-id");
            pm.collections.removeSampleResponse(id);
        });

        var dropZone = document.getElementById('import-collection-dropzone');
        dropZone.addEventListener('dragover', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        }, false);

        dropZone.addEventListener('drop', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var files = evt.dataTransfer.files; // FileList object.

            pm.collections.importCollections(files);
        }, false);

        $('#collection-files-input').on('change', function (event) {
            var files = event.target.files;
            pm.collections.importCollections(files);
            $('#collection-files-input').val("");
        });

        $('.collection-request-description').wysiwyg();
    },

    getCollectionData:function (id, callback) {
        pm.indexedDB.getCollection(id, function (data) {
            var collection = data;
            pm.indexedDB.getAllRequestsInCollection(collection, function (collection, data) {
                var ids = [];
                for (var i = 0, count = data.length; i < count; i++) {
                    ids.push(data[i].id);
                }

                //Get all collection requests with one call
                collection['requests'] = data;
                var name = collection['name'] + ".json";
                var type = "application/json";
                var filedata = JSON.stringify(collection);
                callback(name, type, filedata);
            });
        });
    },

    getCollectionDataForDrive:function (id, callback) {
        pm.indexedDB.getCollection(id, function (data) {
            var collection = data;
            pm.indexedDB.getAllRequestsInCollection(collection, function (collection, data) {
                var ids = [];
                for (var i = 0, count = data.length; i < count; i++) {
                    ids.push(data[i].id);
                }

                //Get all collection requests with one call
                collection['requests'] = data;
                var name = collection['name'] + ".postman_collection";
                var type = "application/json";
                var filedata = JSON.stringify(collection);
                callback(name, type, filedata);
            });
        });
    },

    saveCollection:function (id) {
        pm.collections.getCollectionData(id, function (name, type, filedata) {
            var filename = name + ".postman_collection";
            pm.filesystem.saveAndOpenFile(filename, filedata, type, function () {
            });
        });
    },

    uploadCollection:function (id, callback) {
        pm.collections.getCollectionData(id, function (name, type, filedata) {
            var uploadUrl = pm.webUrl + '/collections';
            $.ajax({
                type:'POST',
                url:uploadUrl,
                data:filedata,
                success:function (data) {
                    var link = data.link;
                    callback(link);
                }
            });

        });
    },

    overwriteCollection:function(originalCollectionId, collection) {
        pm.collections.deleteCollection(originalCollectionId, true);            
        pm.collections.addCollectionDataToDB(collection, true);
    },

    duplicateCollection:function(collection) {
        pm.collections.addCollectionDataToDB(collection, true);
    },

    //Being used in Google Drive
    mergeCollection: function(collection, toSyncWithDrive) {        
        console.log("To merge", collection);
        //Update local collection
        var newCollection = {
            id: collection.id,
            name: collection.name,
            timestamp: collection.timestamp
        };

        if ("order" in collection) {
            newCollection.order = collection.order;
        }

        console.log("Merging collection", newCollection);

        pm.indexedDB.updateCollection(newCollection, function(c) {
            console.log("Collection updated", newCollection);

            var driveCollectionRequests = collection.requests;

            pm.indexedDB.getAllRequestsInCollection(collection, function(collection, oldCollectionRequests) {
                console.log("Old collection requests", oldCollectionRequests);
                var updatedRequests = [];
                var deletedRequests = [];
                var newRequests = [];
                var finalRequests = [];
                var i = 0;
                var size = driveCollectionRequests.length;

                for (i = 0; i < size; i++) {
                    var driveRequest = driveCollectionRequests[i];
                    var existingRequest = _.find(oldCollectionRequests, function(r) {
                        return driveRequest.id === r.id;
                    });

                    if (existingRequest) {
                        updatedRequests.push(driveRequest);
                        //Remove this request from oldCollectionRequests                        
                        //Requsts remaining in oldCollectionRequests will be deleted
                        var sizeOldRequests = oldCollectionRequests.length;
                        var loc = -1;
                        for (var j = 0; j < sizeOldRequests; j++) {
                            if (oldCollectionRequests[j].id === existingRequest.id) {
                                loc = j;
                                break;
                            }
                        }

                        if (loc >= 0) {
                            oldCollectionRequests.splice(loc, 1);
                        }
                    }
                    else {
                        newRequests.push(driveRequest);
                    }
                }

                deletedRequests = oldCollectionRequests;

                //Update requests
                var sizeUpdatedRequests = updatedRequests.length;
                for(i = 0; i < sizeUpdatedRequests; i++) {
                    pm.indexedDB.updateCollectionRequest(updatedRequests[i], function(r) {
                        console.log("Updated the request");
                    });
                }

                //Add requests
                var sizeNewRequests = newRequests.length;
                for(i = 0; i < sizeNewRequests; i++) {
                    pm.indexedDB.addCollectionRequest(newRequests[i], function(r) {
                        console.log("Added the request");
                    });
                }

                //Delete requests
                var sizeDeletedRequests = deletedRequests.length;
                for(i = 0; i < sizeDeletedRequests; i++) {
                    pm.indexedDB.deleteCollectionRequest(deletedRequests[i].id, function(id) {
                        console.log("Deleted the request");
                    });
                }

                newCollection.requests = driveCollectionRequests;
                pm.collections.render(newCollection);
            }); 
        });
    },

    addCollectionDataToDB:function(collection, toSyncWithDrive) {
        console.log("Adding elements to pm.collections.items");
        pm.collections.items.push(collection);
        pm.collections.items.sort(sortAlphabetical);

        pm.indexedDB.addCollection(collection, function (c) {
            var message = {
                name:collection.name,
                action:"added"
            };

            $('.modal-import-alerts').append(Handlebars.templates.message_collection_added(message));        
            var requests = [];

            var ordered = false;
            if ("order" in collection) {
                ordered = true;
            }

            for (var i = 0; i < collection.requests.length; i++) {
                var request = collection.requests[i];
                request.collectionId = collection.id;

                var newId = guid();

                if (ordered) {
                    var currentId = request.id;
                    var loc = _.indexOf(collection["order"], currentId);
                    collection["order"][loc] = newId;
                }

                request.id = newId;

                if ("responses" in request) {
                    var j, count;
                    for (j = 0, count = request["responses"].length; j < count; j++) {
                        request["responses"][j].id = guid();
                        request["responses"][j].collectionRequestId = newId;                        
                    }
                }

                pm.indexedDB.addCollectionRequest(request, function (req) {});
                requests.push(request);
            }

            pm.indexedDB.updateCollection(collection, function() {});            
            collection.requests = requests;
            
            pm.collections.render(collection);

            //collection has all the data            
            console.log("Queuing update");
            if (toSyncWithDrive) {
                pm.collections.drive.queuePostFromCollection(collection);    
            }
            
        });
    },

    importCollectionData:function (collection) {                
        var collections = pm.collections.items;        
        var size = collections.length;
        var found = false;
        var originalCollection;
        for (var i = 0; i < size; i++) {
            if (collections[i].name === collection.name) {
                originalCollection = collections[i];
                found = true;
                break;
            }
        }

        if (found) {
            pm.collections.originalCollectionId = originalCollection.id;
            pm.collections.toBeImportedCollection = collection;
            $("#modal-overwrite-collection-name").html(collection.name);
            $("#modal-overwrite-collection-overwrite").attr("data-collection-id", collection.id);
            $("#modal-overwrite-collection-duplicate").attr("data-collection-id", collection.id);
            $("#modal-overwrite-collection").modal("show");
        }
        else {
            pm.collections.addCollectionDataToDB(collection, true);
        }        
    },

    importCollections:function (files) {
        // Loop through the FileList
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    var data = e.currentTarget.result;
                    var collection = JSON.parse(data);
                    collection.id = guid();
                    pm.collections.importCollectionData(collection);
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    },

    importCollectionFromUrl:function (url) {
        $.get(url, function (data) {
            var collection = data;
            collection.id = guid();
            pm.collections.importCollectionData(collection);
        });
    },

    mergeCollections: function (collections) {
        var size = collections.length;
        for(var i = 0; i < size; i++) {
            var collection = collections[i];
            pm.collections.mergeCollection(collection, true);
        }
    },

    getCollectionRequest:function (id) {
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
        $('#sidebar-request-' + id).addClass('sidebar-collection-request-active');
        pm.indexedDB.getCollectionRequest(id, function (request) {
            pm.request.isFromCollection = true;
            pm.request.collectionRequestId = id;
            pm.request.loadRequestInEditor(request, true);
        });
    },

    loadResponseInEditor:function (id) {
        var responses = pm.request.responses;        
        var responseIndex = find(responses, function (item, i, responses) {
            return item.id === id;
        });

        var response = responses[responseIndex];
        pm.request.loadRequestInEditor(response.request, false, true);
        pm.request.response.render(response);
    },

    //Feature not active yet
    removeSampleResponse:function (id) {
        var responses = pm.request.responses;
        var responseIndex = find(responses, function (item, i, responses) {
            return item.id === id;
        });

        var response = responses[responseIndex];
        responses.splice(responseIndex, 1);

        pm.indexedDB.getCollectionRequest(response.collectionRequestId, function (request) {
            request["responses"] = responses;
            pm.indexedDB.updateCollectionRequest(request, function () {
                $('#request-samples table tr[data-id="' + response.id + '"]').remove();
            });

        });
    },

    openCollection:function (id) {
        var target = "#collection-requests-" + id;
        $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-close");
        $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");

        if ($(target).css("display") === "none") {            
            $(target).slideDown(100, function () {                
                pm.layout.refreshScrollPanes();
            });
        }
    },

    toggleRequestList:function (id) {
        var target = "#collection-requests-" + id;
        var label = "#collection-" + id + " .collection-head-actions .label";
        if ($(target).css("display") === "none") {            
            $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-close");
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");

            $(target).slideDown(100, function () {
                pm.layout.refreshScrollPanes();
            });
        }
        else {
            $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-open");
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-close");            
            $(target).slideUp(100, function () {
                pm.layout.refreshScrollPanes();
            });
        }
    },

    addCollection:function () {
        var newCollection = $('#new-collection-blank').val();

        var collection = new Collection();

        if (newCollection) {
            //Add the new collection and get guid
            collection.id = guid();
            collection.name = newCollection;
            collection.order = [];
            pm.indexedDB.addCollection(collection, function (collection) {
                pm.collections.items.push(collection);
                pm.collections.items.sort(sortAlphabetical);
                
                pm.collections.render(collection);
                pm.collections.drive.queuePostFromCollection(collection);
            });

            $('#new-collection-blank').val("");
        }

        $('#modal-new-collection').modal('hide');
    },

    updateCollectionFromCurrentRequest:function () {
        var url = $('#url').val();
        var collectionRequest = new CollectionRequest();
        collectionRequest.id = pm.request.collectionRequestId;
        collectionRequest.headers = pm.request.getPackedHeaders();
        collectionRequest.url = url;
        collectionRequest.method = pm.request.method;
        collectionRequest.data = pm.request.body.getData(true);
        collectionRequest.dataMode = pm.request.dataMode;
        collectionRequest.version = 2;
        collectionRequest.time = new Date().getTime();

        pm.indexedDB.getCollectionRequest(collectionRequest.id, function (req) {
            collectionRequest.name = req.name;
            collectionRequest.description = req.description;
            collectionRequest.collectionId = req.collectionId;
            $('#sidebar-request-' + req.id + " .request .label").removeClass('label-method-' + req.method);

            pm.indexedDB.updateCollectionRequest(collectionRequest, function (request) {
                var requestName;
                if (request.name == undefined) {
                    request.name = request.url;
                }

                requestName = limitStringLineWidth(request.name, 43);

                $('#sidebar-request-' + request.id + " .request .request-name").html(requestName);
                $('#sidebar-request-' + request.id + " .request .label").html(request.method);
                $('#sidebar-request-' + request.id + " .request .label").addClass('label-method-' + request.method);
                noty(
                    {
                        type:'success',
                        text:'Saved request',
                        layout:'topCenter',
                        timeout:750
                    });

                //Sync collection to drive
                pm.collections.drive.queueUpdateFromId(collectionRequest.collectionId);
            });
        });

    },

    addRequestToCollection:function () {
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');

        var existingCollectionId = $('#select-collection').val();
        var newCollection = $("#new-collection").val();
        var newRequestName = $('#new-request-name').val();
        var newRequestDescription = $('#new-request-description').val();

        var url = $('#url').val();
        if (newRequestName === "") {
            newRequestName = url;
        }

        var collection = new Collection();

        var collectionRequest = new CollectionRequest();
        collectionRequest.id = guid();
        collectionRequest.headers = pm.request.getPackedHeaders();
        collectionRequest.url = url;
        collectionRequest.method = pm.request.method;
        collectionRequest.data = pm.request.body.getData(true);
        collectionRequest.dataMode = pm.request.dataMode;
        collectionRequest.name = newRequestName;
        collectionRequest.description = newRequestDescription;
        collectionRequest.time = new Date().getTime();
        collectionRequest.version = 2;
        collectionRequest.responses = pm.request.responses;

        if (newCollection) {
            //Add the new collection and get guid
            collection.id = guid();
            collection.name = newCollection;
            collection.order = [collectionRequest.id];

            pm.indexedDB.addCollection(collection, function (collection) {
                $('#sidebar-section-collections .empty-message').css("display", "none");
                $('#new-collection').val("");
                collectionRequest.collectionId = collection.id;

                $('#select-collection').append(Handlebars.templates.item_collection_selector_list(collection));
                $('#collection-items').append(Handlebars.templates.item_collection_sidebar_head(collection));

                $('a[rel="tooltip"]').tooltip();
                pm.layout.refreshScrollPanes();
                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                    var targetElement = "#collection-requests-" + req.collectionId;
                    $('#sidebar-request-' + req.id).addClass('sidebar-collection-request-active');
                    pm.urlCache.addUrl(req.url);

                    if (typeof req.name === "undefined") {
                        req.name = req.url;
                    }
                    req.name = limitStringLineWidth(req.name, 43);

                    $(targetElement).append(Handlebars.templates.item_collection_sidebar_request(req));

                    pm.layout.refreshScrollPanes();

                    pm.request.isFromCollection = true;
                    pm.request.collectionRequestId = collectionRequest.id;
                    $('#update-request-in-collection').css("display", "inline-block");
                    pm.collections.openCollection(collectionRequest.collectionId);

                    //Sync collection to drive
                    console.log("Send queue request after adding request for new collection");
                    pm.collections.drive.queuePost(collectionRequest.collectionId);
                });
            });
        }
        else {
            //Get guid of existing collection
            collection.id = existingCollectionId;
            collectionRequest.collectionId = collection.id;
            console.log("Adding request to existing collection");
            pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                console.log("Added request to existing collection");
                var targetElement = "#collection-requests-" + req.collectionId;
                pm.urlCache.addUrl(req.url);

                if (typeof req.name === "undefined") {
                    req.name = req.url;
                }

                req.name = limitStringLineWidth(req.name, 43);

                $(targetElement).append(Handlebars.templates.item_collection_sidebar_request(req));
                $('#sidebar-request-' + req.id).addClass('sidebar-collection-request-active');

                pm.layout.refreshScrollPanes();

                pm.request.isFromCollection = true;
                pm.request.collectionRequestId = collectionRequest.id;
                $('#update-request-in-collection').css("display", "inline-block");
                pm.collections.openCollection(collectionRequest.collectionId);

                //Update collection's order element    
                console.log("Updating collection");
                pm.indexedDB.getCollection(collection.id, function(collection) {
                    if("order" in collection) {
                        console.log("Order found in collection");
                        collection["order"].push(collectionRequest.id);
                        pm.indexedDB.updateCollection(collection, function() {});

                        //Sync collection to drive
                        console.log("Send queue request after adding request");
                        pm.collections.drive.queueUpdateFromId(collection.id);
                    }
                    else {
                        console.log("Order not found in collection");
                    }
                });
            });
        }        

        pm.layout.sidebar.select("collections");

        $('#request-meta').css("display", "block");
        $('#request-name').css("display", "block");
        $('#request-description').css("display", "block");
        $('#request-name').html(newRequestName);
        $('#request-description').html(newRequestDescription);
        $('#sidebar-selectors a[data-id="collections"]').tab('show');
    },

    getAllCollections:function () {
        $('#collection-items').html("");
        $('#select-collection').html("<option>Select</option>");
        pm.indexedDB.getCollections(function (items) {            
            pm.collections.items = items;
            pm.collections.items.sort(sortAlphabetical);

            var itemsLength = items.length;

            if (itemsLength === 0) {
                $('#sidebar-section-collections').append(Handlebars.templates.message_no_collection({}));
            }
            else {
                for (var i = 0; i < itemsLength; i++) {
                    var collection = items[i];
                    pm.indexedDB.getAllRequestsInCollection(collection, function (collection, requests) {
                        collection.requests = requests;
                        pm.collections.render(collection);
                    });
                }
            }


            pm.collections.areLoaded = true;
            pm.layout.refreshScrollPanes();
        });
    },

    handleRequestDropOnCollection: function(event, ui) {
        var id = ui.draggable.context.id;
        var requestId = $('#' + id + ' .request').attr("data-id");
        var targetCollectionId = $($(event.target).find('.sidebar-collection-head-name')[0]).attr('data-id');      
        pm.indexedDB.getCollection(targetCollectionId, function(collection) {            
            pm.indexedDB.getCollectionRequest(requestId, function(collectionRequest) {
                if(targetCollectionId == collectionRequest.collectionId) return;

                pm.collections.deleteCollectionRequest(requestId);

                collectionRequest.id = guid();
                collectionRequest.collectionId = targetCollectionId;            

                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {                        
                    var targetElement = "#collection-requests-" + req.collectionId;
                    pm.urlCache.addUrl(req.url);

                    if (typeof req.name === "undefined") {
                        req.name = req.url;
                    }
                    req.name = limitStringLineWidth(req.name, 43);

                    $(targetElement).append(Handlebars.templates.item_collection_sidebar_request(req));
                    pm.layout.refreshScrollPanes();

                    $('#update-request-in-collection').css("display", "inline-block");
                    pm.collections.openCollection(collectionRequest.collectionId);

                    //Add the drag event listener
                    $('#collection-' + collectionRequest.collectionId + " .sidebar-collection-head").droppable({
                        accept: ".sidebar-collection-request",
                        hoverClass: "ui-state-hover",
                        drop: pm.collections.handleRequestDropOnCollection
                    });

                    //Update collection's order element    
                    pm.indexedDB.getCollection(collection.id, function(collection) {                        
                        console.log("Updating collection order");
                        if("order" in collection) {                                                
                            collection["order"].push(collectionRequest.id);                                                        
                            pm.indexedDB.updateCollection(collection, function() {    
                                console.log("Updating collection from drop");                            
                                pm.collections.drive.queueUpdateFromId(collection.id);
                            });
                        }
                    });
                });
            });
        });
    },

    render:function (collection) {
        $('#sidebar-section-collections .empty-message').css("display", "none");

        var currentEl = $('#collection-' + collection.id);

        var collectionSidebarListPosition = -1;
        var insertionType;
        var insertTarget;
        var collections = pm.collections.items;
        var collectionSidebarListPosition = arrayObjectIndexOf(collections, collection.id, "id");

        //Does this exist already?
        if (currentEl.length) {
            //Find current element list position                                    
            if (collectionSidebarListPosition == 0) {
                insertionType = "before";
                insertTarget = $('#collection-' + collections[collectionSidebarListPosition + 1].id);
                console.log(insertTarget);
            }
            else {
                insertionType = "after";
                insertTarget = $('#collection-' + collections[collectionSidebarListPosition - 1].id);
            }

            //Found element
            currentEl.remove();
            //Remove from select too
            $('#select-collection option[value="' + collection.id + '"]').remove();
        }        
        else {
            //New element
            if (collectionSidebarListPosition === collections.length - 1) {
                insertionType = "append";
            }
            else {                
                var nextCollectionId = collections[collectionSidebarListPosition + 1].id;
                insertTarget = $("#collection-" + nextCollectionId);                

                if (insertTarget.length > 0) {
                    insertionType = "before";    
                }
                else {
                    insertionType = "append";
                }                            
            }
        }

        $('#select-collection').append(Handlebars.templates.item_collection_selector_list(collection));
        
        if (insertionType) {
            if (insertionType === "after") {
                $(insertTarget).after(Handlebars.templates.item_collection_sidebar_head(collection));
            }
            else if (insertionType === "before") {
                $(insertTarget).before(Handlebars.templates.item_collection_sidebar_head(collection));
            }    
            else {
                $("#collection-items").append(Handlebars.templates.item_collection_sidebar_head(collection));    
            }
        } else {
            $("#collection-items").append(Handlebars.templates.item_collection_sidebar_head(collection));
        }        

        $('a[rel="tooltip"]').tooltip();

        $('#collection-' + collection.id + " .sidebar-collection-head").droppable({
            accept: ".sidebar-collection-request",
            hoverClass: "ui-state-hover",
            drop: pm.collections.handleRequestDropOnCollection
        });

        if ("requests" in collection) {
            var id = collection.id;
            var requests = collection.requests;
            var targetElement = "#collection-requests-" + id;
            var count = requests.length;
            var requestTargetElement;

            if (count > 0) {
                for (var i = 0; i < count; i++) {
                    pm.urlCache.addUrl(requests[i].url);
                    if (typeof requests[i].name === "undefined") {
                        requests[i].name = requests[i].url;
                    }
                    requests[i].name = limitStringLineWidth(requests[i].name, 40);

                    
                    //Make requests draggable for moving to a different collection
                    requestTargetElement = "#sidebar-request-" + requests[i].id;                    
                    $(requestTargetElement).draggable({});
                }

                //Sort requests as A-Z order
                if (!("order" in collection)) {
                    requests.sort(sortAlphabetical);
                }
                else {
                    if(collection["order"].length == requests.length) {
                        var orderedRequests = [];                    
                        for (var j = 0, len = collection["order"].length; j < len; j++) {
                            var element = _.find(requests, function (request) {
                                return request.id == collection["order"][j]
                            });
                            orderedRequests.push(element);
                        }
                        requests = orderedRequests;
                    }
                }

                //Add requests to the DOM
                $(targetElement).append(Handlebars.templates.collection_sidebar({"items":requests}));


                $(targetElement).sortable({
                    update:function (event, ui) {
                        var target_parent = $(event.target).parents(".sidebar-collection-requests");                        
                        var target_parent_collection = $(event.target).parents(".sidebar-collection");                        
                        var collection_id = $(target_parent_collection).attr("data-id");
                        var ul_id = $(target_parent.context).attr("id");                        
                        var collection_requests = $(target_parent.context).children("li");
                        var count = collection_requests.length;
                        var order = [];

                        for (var i = 0; i < count; i++) {
                            var li_id = $(collection_requests[i]).attr("id");
                            var request_id = $("#" + li_id + " .request").attr("data-id");
                            order.push(request_id);
                        }

                        pm.indexedDB.getCollection(collection_id, function (collection) {                            
                            collection["order"] = order;
                            pm.indexedDB.updateCollection(collection, function (collection) {
                                //Sync with Google Drive
                                pm.collections.drive.queueUpdateFromId(collection.id);
                            });
                        });
                    }
                });
            }

        }

        pm.layout.refreshScrollPanes();
    },

    deleteCollectionRequest:function (id) {
        console.log("deleting request");
        pm.indexedDB.getCollectionRequest(id, function(request) {
            pm.indexedDB.deleteCollectionRequest(id, function () {
                pm.layout.sidebar.removeRequestFromHistory(id);
                //Update order
                pm.indexedDB.getCollection(request.collectionId, function (collection) {                            
                    //If the collection still exists
                    if (collection) {
                        if ("order" in collection) {
                            var order = collection["order"];
                            var index = order.indexOf(id);
                            order.splice(index, 1);
                            collection["order"] = order;
                            pm.indexedDB.updateCollection(collection, function (collection) {      
                                console.log("Updated collection order, queue update for drive");            
                                pm.collections.drive.queueUpdateFromId(collection.id);
                            });    
                        }                        
                    }                    
                });
            });
        });        
    },

    updateCollectionMeta: function(id, name) {
        pm.indexedDB.getCollection(id, function (collection) {
            collection.name = name;
            pm.indexedDB.updateCollection(collection, function (collection) {             
                var collectionHeadHtml = '<span class="sidebar-collection-head-dt"><img src="img/dt.png"/></span>';
                collectionHeadHtml += " " + collection.name;

                $('#collection-' + collection.id + " .sidebar-collection-head-name").html(collectionHeadHtml);
                $('#select-collection option[value="' + collection.id + '"]').html(collection.name);  

                //Sync collection to drive           
                console.log("Queue update after updating collection meta");
                pm.collections.drive.queueUpdateFromId(collection.id);
            });
        });        
    },

    updateCollectionRequestMeta: function(id, name, description) {
        pm.indexedDB.getCollectionRequest(id, function (req) {
            req.name = name;
            req.description = description;
            pm.indexedDB.updateCollectionRequest(req, function (newRequest) {
                var requestName;
                if (req.name != undefined) {
                    requestName = limitStringLineWidth(req.name, 43);
                }
                else {
                    requestName = limitStringLineWidth(req.url, 43);
                }

                $('#sidebar-request-' + req.id + " .request .request-name").html(requestName);
                if (pm.request.collectionRequestId === req.id) {
                    $('#request-name').html(req.name);
                    $('#request-description').html(req.description);
                }
                $('#modal-edit-collection-request').modal('hide');

                //Sync collection to drive
                console.log("Queue update after updating collection request meta");
                pm.collections.drive.queueUpdateFromId(req.collectionId);
            });
        });
    },

    deleteCollection:function (id, toSyncWithDrive, callback) {
        var collections = pm.collections.items;
        var size = collections.length;
        
        for (var i = 0; i < size; i++) {
            if (collections[i].id === id) {
                pm.collections.items.splice(i, 1);
                break;
            }
        }

        pm.indexedDB.deleteCollection(id, function () {
            pm.layout.sidebar.removeCollection(id);
            var target = '#select-collection option[value="' + id + '"]';
            $(target).remove();

            //Sync collection to drive
            if(toSyncWithDrive) {
                pm.collections.drive.queueDelete(id);    
            }            
        });
    },

    saveResponseAsSample:function (response) {
        pm.indexedDB.getCollectionRequest(response.collectionRequestId, function (request) {
            if ("responses" in request && request["responses"] !== undefined) {
                request["responses"].push(response);
            }
            else {
                request["responses"] = [response];
            }

            pm.request.responses = request["responses"];
            pm.indexedDB.updateCollectionRequest(request, function () {
                noty(
                    {
                        type:'success',
                        text:'Saved response',
                        layout:'topRight',
                        timeout:750
                    });

                $('#request-samples').css("display", "block");
                $('#request-samples table').append(Handlebars.templates.item_sample_response(response));
            });

        });
    },

    filter: function(term) {
        term = term.toLowerCase();
        var collections = pm.collections.items;
        var collectionCount = collections.length;
        var filteredCollections = [];
        for(var i = 0; i < collectionCount; i++) {
            var c = {
                id: collections[i].id,
                name: collections[i].name,
                requests: [],
                toShow: false,                
            };

            var name = collections[i].name.toLowerCase();

            if (name.indexOf(term) >= 0) {
                c.toShow = true;
            }

            var requests = collections[i].requests;

            if (requests) {
                var requestsCount = requests.length;

                for(var j = 0; j < requestsCount; j++) {
                    var r = {
                        id: requests[j].id,
                        name: requests[j].name,
                        toShow: false
                    };

                    c.requests.push(r);

                    var name = requests[j].name.toLowerCase();

                    if (name.indexOf(term) >= 0) {
                        r.toShow = true;
                        c.toShow = true;
                    }
                    else {
                        r.toShow = false;
                    }
                }
            }            

            filteredCollections.push(c);
        }

        return filteredCollections;
    },

    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) return;

                pm.drive.onUpdate["postman_collection"] = pm.collections.drive.updateLocalFromDrive;
                pm.drive.onPost["postman_collection"] = pm.collections.drive.addLocalFromDrive;
                pm.drive.onDelete["collection"] = pm.collections.drive.deleteLocalFromDrive;
            }
        },

        checkIfCollectionIsOnDrive: function(id, callback) {
            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                if (driveFile) {
                    console.log("Collection found");
                    callback(true, driveFile);
                }
                else {
                    console.log("Collection not found");
                    callback(false);
                }
                
            });
        },

        queuePostFromCollection: function(collection) {
            if (!pm.drive.isSyncEnabled()) return;

            var id = collection.id;
            var name = collection.name + ".postman_collection";
            var filedata = JSON.stringify(collection);
            
            pm.drive.queuePost(id, "collection", name, filedata, function() {
                console.log("Uploaded new collection", name);                
            });            
        },

        queuePost: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.collections.getCollectionData(id, function(name, type, filedata) {
                console.log(filedata);
                pm.drive.queuePost(id, "collection", name + ".postman_collection", filedata, function() {
                    console.log("Uploaded new collection", name);                
                });
            });
        },

        queueUpdateFromCollection: function(collection) {
            if (!pm.drive.isSyncEnabled()) return;

            var id = collection.id;
            var name = collection.name + ".postman_collection";
            var filedata = JSON.stringify(collection);

            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                pm.drive.queueUpdate(id, "collection", name, driveFile.file, filedata, function() {
                    console.log("Updated collection", collection.id);                
                });
            });
        },

        queueUpdateFromId: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.collections.getCollectionDataForDrive(id, function(name, type, filedata) {                
                pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                    pm.drive.queueUpdate(id, "collection", name, driveFile.file, filedata, function() {
                        console.log("Updated collection from id", id);                
                    });
                });                
            });
        },

        queueTrash: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.collections.drive.checkIfCollectionIsOnDrive(id, function(exists, driveFile) {
                if (exists) {                
                    pm.drive.queueTrash(id, "collection", driveFile.file, function() {                    
                        console.log("Deleted collection", id);                    
                    });
                }
            });            
        },

        queueDelete: function(id) {
            if (!pm.drive.isSyncEnabled()) return;

            pm.collections.drive.checkIfCollectionIsOnDrive(id, function(exists, driveFile) {
                if (exists) {                
                    pm.drive.queueDelete(id, "collection", driveFile.file, function() {                    
                        console.log("Deleted collection", id);                    
                    });
                }
            });            
        },

        updateLocalFromDrive: function(responseText) {
            console.log("Update local from drive", responseText);
            var collection = JSON.parse(responseText);
            console.log(collection, responseText);
            pm.collections.mergeCollection(collection, false);
        },


        deleteLocalFromDrive: function(id) {
            console.log("Trying to delete", id);
            pm.collections.deleteCollection(id, false);
            pm.indexedDB.driveFiles.deleteDriveFile(id, function() {                        
            });
        },

        addLocalFromDrive: function(file, responseText) {
            var collection = JSON.parse(responseText);
            console.log("Add to DB");
            pm.collections.addCollectionDataToDB(collection, false);

            var newLocalDriveFile = {
                "id": collection.id,
                "type": "collection",
                "timestamp":new Date().getTime(),
                "fileId": file.id,
                "file": file
            };

            pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {
                console.log("Uploaded file", newLocalDriveFile);                            
                var currentTime = new Date().toISOString();
                pm.settings.setSetting("lastDriveChangeTime", currentTime);                
            });  
        }
    }
};