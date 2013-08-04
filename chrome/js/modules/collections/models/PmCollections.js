var PmCollections = Backbone.Collection.extend({
    areLoaded: false,

    originalCollectionId: "",
    toBeImportedCollection:{},

    model: PmCollection,

    comparator: function(a, b) {        
        var counter;

        var aName = a.get("name");
        var bName = b.get("name");

        if (aName.length > bName.legnth)
            counter = bName.length;
        else
            counter = aName.length;

        for (var i = 0; i < counter; i++) {
            if (aName[i] == bName[i]) {
                continue;
            } else if (aName[i] > bName[i]) {
                return 1;
            } else {
                return -1;
            }
        }
        return 1;
    },

    initialize: function() {
        //TODO: Drive syncing will be done later
        //pm.collections.drive.registerHandlers();
        this.getAllCollections();
    },

    getAllCollections:function () {
        var pmCollection = this;

        pm.indexedDB.getCollections(function (items) {
            var itemsLength = items.length;

            function onGetAllRequestsInCollection(collection, requests) {
                var c = new PmCollection(collection);
                c.set("requests", requests);
                pmCollection.add(c);
            }

            for (var i = 0; i < itemsLength; i++) {
                var collection = items[i];
                pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);
            }

            pmCollection.areLoaded = true;
        });
    },

    getRequestById: function(id) {
        function existingRequestFinder(r) {
            return r.id === id;
        }

        for(var i = 0; i < this.length; i++) {
            var collection = this.models[i];
            var requests = collection.get("requests");
            var request = _.find(requests, existingRequestFinder);
            if (request) {
                return request;
            }
        }

        return null;
    },

    getFolderById: function(id) {
        function existingFolderFinder(r) {
            return r.id === id;
        }

        for(var i = 0; i < this.length; i++) {
            var collection = this.models[i];
            var folders = collection.get("folders");
            var folder = _.find(folders, existingFolderFinder);
            if (folder) {
                return folder;
            }
        }

        return null;
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
        this.getCollectionData(id, function (name, type, filedata) {
            var filename = name + ".postman_collection";
            pm.filesystem.saveAndOpenFile(filename, filedata, type, function () {
                noty(
                    {
                        type:'success',
                        text:'Saved collection to disk',
                        layout:'topCenter',
                        timeout:750
                    });
            });
        });
    },

    uploadCollection:function (id, callback) {
        this.getCollectionData(id, function (name, type, filedata) {
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
        this.deleteCollection(originalCollectionId, true);
        this.addCollectionDataToDB(collection, true);
    },

    duplicateCollection:function(collection) {
        this.addCollectionDataToDB(collection, true);
    },

    //Being used in Google Drive
    mergeCollection: function(collection, toSyncWithDrive) {
        var pmCollection = this;

        //Update local collection
        var newCollection = {
            id: collection.id,
            name: collection.name,
            timestamp: collection.timestamp
        };

        if ("order" in collection) {
            newCollection.order = collection.order;
        }

        pm.indexedDB.updateCollection(newCollection, function(c) {
            var driveCollectionRequests = collection.requests;

            pm.indexedDB.getAllRequestsInCollection(collection, function(collection, oldCollectionRequests) {                
                var updatedRequests = [];
                var deletedRequests = [];
                var newRequests = [];
                var finalRequests = [];
                var i = 0;
                var size = driveCollectionRequests.length;

                function existingRequestFinder(r) {
                    return driveRequest.id === r.id;
                }

                for (i = 0; i < size; i++) {
                    var driveRequest = driveCollectionRequests[i];
                    var existingRequest = _.find(oldCollectionRequests, existingRequestFinder);

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
                function onUpdateCollectionRequest(r) {                    
                }

                for(i = 0; i < sizeUpdatedRequests; i++) {
                    pm.indexedDB.updateCollectionRequest(updatedRequests[i], onUpdateCollectionRequest);
                }

                //Add requests
                function onAddCollectionRequest(r) {                    
                }

                var sizeNewRequests = newRequests.length;
                for(i = 0; i < sizeNewRequests; i++) {
                    pm.indexedDB.addCollectionRequest(newRequests[i], onAddCollectionRequest);
                }

                //Delete requests
                function onDeleteCollectionRequest(id) {                    
                }

                var sizeDeletedRequests = deletedRequests.length;
                for(i = 0; i < sizeDeletedRequests; i++) {
                    pm.indexedDB.deleteCollectionRequest(deletedRequests[i].id, onDeleteCollectionRequest);
                }

                newCollection.requests = driveCollectionRequests;

                pmCollection.add(newCollection, {merge: true});
            });
        });
    },

    addCollectionDataToDB:function(collection, toSyncWithDrive) {
        var pmCollection = this;

        var dbCollection = _.clone(collection);
        dbCollection["requests"] = [];

        pm.indexedDB.addCollection(dbCollection, function (c) {
            var message = {
                name:dbCollection.name,
                action:"added"
            };

            pmCollection.trigger("importCollection", message);

            var requests = [];

            var ordered = false;
            if ("order" in dbCollection) {
                ordered = true;
            }

            function onAddCollectionRequest(req) {                
            }

            for (var i = 0; i < collection.requests.length; i++) {
                var request = collection.requests[i];
                request.collectionId = collection.id;

                var newId = guid();

                if (ordered) {
                    var currentId = request.id;
                    var loc = _.indexOf(collection["order"], currentId);
                    dbCollection["order"][loc] = newId;
                }

                request.id = newId;

                if ("responses" in request) {
                    var j, count;
                    for (j = 0, count = request["responses"].length; j < count; j++) {
                        request["responses"][j].id = guid();
                        request["responses"][j].collectionRequestId = newId;
                    }
                }

                pm.indexedDB.addCollectionRequest(request, onAddCollectionRequest);
                requests.push(request);
            }

            pm.indexedDB.updateCollection(dbCollection, function() {});

            var c = new PmCollection(dbCollection);
            c.set("requests", requests);
            pmCollection.add(c, {merge: true});

            if (toSyncWithDrive) {
                //TODO: Drive syncing will be done later
                pm.collections.drive.queuePostFromCollection(dbCollection);
            }

        });
    },

    importCollectionData:function (collection) {
        var originalCollection = this.findWhere({name: collection.name});

        if (originalCollection) {
            this.originalCollectionId = originalCollection.id;
            this.toBeImportedCollection = collection;
            this.trigger("overwriteCollection", collection);
        }
        else {
            this.addCollectionDataToDB(collection, true);
        }
    },

    importCollections:function (files) {
        var pmCollection = this;

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
                    pmCollection.importCollectionData(collection);
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    },

    importCollectionFromUrl:function (url) {
        var pmCollection = this;

        $.get(url, function (data) {
            var collection = data;
            collection.id = guid();
            pmCollection.importCollectionData(collection);
        });
    },

    mergeCollections: function (collections) {
        var pmCollection = this;

        var size = collections.length;
        for(var i = 0; i < size; i++) {
            var collection = collections[i];
            pmCollection.mergeCollection(collection, true);
        }
    },

    getCollectionRequest:function (id) {
        var pmCollection = this;
        
        pm.indexedDB.getCollectionRequest(id, function (request) {
            request.isFromCollection = true;
            request.collectionRequestId = id;
            pm.request.loadRequestInEditor(request, true);
            pmCollection.trigger("selectedCollectionRequest", request);
        });
    },

    // TODO Needs to be changed
    loadResponseInEditor:function (id) {
        var responses = pm.request.responses;
        var responseIndex = find(responses, function (item, i, responses) {
            return item.id === id;
        });

        var response = responses[responseIndex];
        pm.request.loadRequestInEditor(response.request, false, true);
        pm.request.response.render(response);
    },

    // TODO Needs to be changed
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

    addCollection:function (name) {
        var pmCollection = this;

        var collection = {};

        if (name) {
            collection.id = guid();
            collection.name = name;
            collection.order = [];
            pm.indexedDB.addCollection(collection, function (collection) {
                pmCollection.add(collection, {merge: true});
                //TODO: Drive syncing will be done later
                // pm.collections.drive.queuePostFromCollection(collection);
            });

        }
    },

    //Refactor this function
    updateCollectionRequest:function (collectionRequest) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(collectionRequest.id, function (req) {
            collectionRequest.name = req.name;
            collectionRequest.description = req.description;
            collectionRequest.collectionId = req.collectionId;

            pm.indexedDB.updateCollectionRequest(collectionRequest, function (request) {
                if (request.name === undefined) {
                    request.name = request.url;
                }

                var c = pmCollection.get(collectionRequest.collectionId);
                c.updateRequest(collectionRequest);

                pmCollection.trigger("updateCollectionRequest", request);

                //TODO: Drive syncing will be done later
                pm.collections.drive.queueUpdateFromId(collectionRequest.collectionId);
            });
        });

    },

    addRequestToCollection:function (collectionRequest, collection) {
        var pmCollection = this;

        if (collection.name) {
            collection.requests = [];
            collection.order = [collectionRequest.id];

            pm.indexedDB.addCollection(collection, function (newCollection) {
                pmCollection.add(newCollection, {merge: true});
                collectionRequest.collectionId = newCollection.id;

                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {                                                                                
                    var c = pmCollection.get(collection.id);
                    c.get("requests").push(req);
                    pmCollection.trigger("addCollectionRequest", req);

                    pmCollection.getCollectionRequest(req.id);

                    pm.collections.drive.queuePost(collectionRequest.collectionId);
                });
            });

        }
        else {
            collectionRequest.collectionId = collection.id;
            pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {                
                pm.indexedDB.getCollection(collection.id, function(newCollection) {
                    pmCollection.getCollectionRequest(req.id);

                    pmCollection.add(newCollection, {merge: true});

                    var c = pmCollection.get(newCollection.id);
                    c.get("requests").push(req);

                    pmCollection.trigger("addCollectionRequest", req);

                    if("order" in newCollection) {
                        newCollection["order"].push(req.id);
                        pm.indexedDB.updateCollection(newCollection, function() {});
                        pm.collections.drive.queueUpdateFromId(newCollection.id);
                    }
                    else {
                        newCollection["order"] = [req.id];
                        pm.indexedDB.updateCollection(newCollection, function() {});
                        pm.collections.drive.queueUpdateFromId(newCollection.id);
                    }
                });
            });
        }

        this.trigger("updateCollectionRequest", collectionRequest);
    },

    deleteCollectionRequest:function (id) {
        var pmCollection = this;
        pm.indexedDB.getCollectionRequest(id, function(request) {
            pm.indexedDB.deleteCollectionRequest(id, function () {
                pmCollection.trigger("removeCollectionRequest", request);

                //Update order
                pm.indexedDB.getCollection(request.collectionId, function (collection) {
                    //If the collection still exists
                    if (collection) {
                        // TODO Check if request exists in "order" or one of the "folders"
                        // TODO Change the collection Backbone model
                        if ("order" in collection) {
                            var order = collection["order"];
                            var index = order.indexOf(id);
                            order.splice(index, 1);
                            collection["order"] = order;
                            pm.indexedDB.updateCollection(collection, function (collection) {
                                // TODO: Drive syncing will be done later
                                // pm.collections.drive.queueUpdateFromId(collection.id);
                            });
                        }
                    }
                });
            });
        });
    },

    updateCollection: function(collection) {
        var pmCollection = this;

        pm.indexedDB.updateCollection(collection, function (collection) {
            pmCollection.add(collection, {merge: true});
            var collectionModel = pmCollection.get(collection.id);
            pmCollection.trigger("updateCollection", collectionModel, pmCollection);
            //TODO: Drive syncing will be done later
            // pm.collections.drive.queueUpdateFromId(collection.id);
        });
    },

    updateCollectionOrder: function(id, order) {
        var pmCollection = this;
        
        pm.indexedDB.getCollection(id, function (collection) {
            collection["order"] = order;
            pmCollection.add(collection, {merge: true});
            pm.indexedDB.updateCollection(collection, function (collection) {
                //TODO: Drive syncing will be done later
                pm.collections.drive.queueUpdateFromId(collection.id);
            });
        });
    },

    updateCollectionMeta: function(id, name) {
        var pmCollection = this;

        pm.indexedDB.getCollection(id, function (collection) {
            collection.name = name;
            pm.indexedDB.updateCollection(collection, function (collection) {
                pmCollection.add(collection, {merge: true});
                pmCollection.trigger("updateCollectionMeta", collection);

                // TODO: Drive syncing will be done later
                // console.log("Queue update after updating collection meta");
                // pm.collections.drive.queueUpdateFromId(collection.id);
            });
        });
    },

    updateCollectionRequestMeta: function(id, name, description) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(id, function (req) {
            req.name = name;
            req.description = description;
            pm.indexedDB.updateCollectionRequest(req, function (newRequest) {                
                var c = pmCollection.get(newRequest.collectionId);
                c.updateRequest(newRequest);
                
                pmCollection.trigger("updateCollectionRequest", newRequest);
                pm.collections.drive.queueUpdateFromId(req.collectionId);
            });
        });
    },

    deleteCollection:function (id, toSyncWithDrive, callback) {
        this.remove(id);

        pm.indexedDB.deleteCollection(id, function () {
            if (callback) {
                callback();    
            }
            

            //TODO: Drive syncing will be done later
            if(toSyncWithDrive) {
                pm.collections.drive.queueDelete(id);
            }
        });
    },

    addFolder: function(parentId, folderName) {
        var collection = this.get(parentId);

        var newFolder = {
            "id": guid(),
            "name": folderName,
            "description": "",
            "order": []
        };

        var folders;

        if(collection.get("folders")) {
            folders = collection.get("folders");
        }
        else {
            folders = [];
        }

        folders.push(newFolder);
        collection.set("folders", folders);
        this.updateCollection(collection.toJSON());
    },  

    //TODO Fix this later
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
        var collections = this.toJSON();
        var collectionCount = collections.length;
        var filteredCollections = [];
        var name;

        for(var i = 0; i < collectionCount; i++) {
            var c = {
                id: collections[i].id,
                name: collections[i].name,
                requests: [],
                toShow: false,
            };

            name = collections[i].name.toLowerCase();

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

                    name = requests[j].name.toLowerCase();

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

        this.trigger("filter", filteredCollections);
        return filteredCollections;
    },

    revert: function() {
        this.trigger("revertFilter");
    },

    moveRequestToCollection: function(requestId, targetCollectionId) {
        var pmCollection = this;

        pm.indexedDB.getCollection(targetCollectionId, function(collection) {

            pm.indexedDB.getCollectionRequest(requestId, function(collectionRequest) {

                if(targetCollectionId === collectionRequest.collectionId) {
                    return;
                }

                _.bind(pmCollection.deleteCollectionRequest, pmCollection)(requestId);

                collectionRequest.id = guid();
                collectionRequest.collectionId = targetCollectionId;

                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                    if("order" in collection) {
                        collection["order"].push(req.id);
                    }
                    else {
                        collection["order"] = [req.id];
                    }

                    pm.indexedDB.updateCollection(collection, function() {
                        var c = pmCollection.get(collection.id);
                        c.get("requests").push(req);
                        pmCollection.add(c, {merge: true});
                        pmCollection.trigger("addCollectionRequest", req);

                        //TODO: Drive syncing will be done later
                        pm.collections.drive.queueUpdateFromId(collection.id);
                    });
                });
            });
        });
    },

    moveRequestToFolder: function(requestId, targetFolderId) {
        var pmCollection = this;
        var request = this.getRequestById(requestId);
        var folder = this.getFolderById(targetFolderId);        

        console.log("Called dropRequestOnFolder", requestId, targetFolderId, this.getCollectionForFolderId(targetFolderId));
    },

    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) {
                    return;
                }

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
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = collection.id;
            var name = collection.name + ".postman_collection";
            var filedata = JSON.stringify(collection);

            pm.drive.queuePost(id, "collection", name, filedata, function() {
                console.log("Uploaded new collection", name);
            });
        },

        queuePost: function(id) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            pm.collections.getCollectionData(id, function(name, type, filedata) {
                console.log(filedata);
                pm.drive.queuePost(id, "collection", name + ".postman_collection", filedata, function() {
                    console.log("Uploaded new collection", name);
                });
            });
        },

        queueUpdateFromCollection: function(collection) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

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
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            pm.collections.getCollectionDataForDrive(id, function(name, type, filedata) {
                pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                    pm.drive.queueUpdate(id, "collection", name, driveFile.file, filedata, function() {
                        console.log("Updated collection from id", id);
                    });
                });
            });
        },

        queueTrash: function(id) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            pm.collections.drive.checkIfCollectionIsOnDrive(id, function(exists, driveFile) {
                if (exists) {
                    pm.drive.queueTrash(id, "collection", driveFile.file, function() {
                        console.log("Deleted collection", id);
                    });
                }
            });
        },

        queueDelete: function(id) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

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
});