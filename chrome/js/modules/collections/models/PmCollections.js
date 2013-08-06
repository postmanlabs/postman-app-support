var PmCollections = Backbone.Collection.extend({
    areLoaded: false,

    //TODO Needs to be refactored
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
        this.getAllCollections();
    },

    // Load all collections
    getAllCollections:function () {
        var pmCollection = this;

        pm.indexedDB.getCollections(function (items) {
            var itemsLength = items.length;

            function onGetAllRequestsInCollection(collection, requests) {
                var c = new PmCollection(collection);
                c.setRequests(requests);
                pmCollection.add(c);

                for(var i = 0; i < requests.length; i++) {
                    pm.urlCache.addUrl(requests[i].url);
                }
            }

            for (var i = 0; i < itemsLength; i++) {
                var collection = items[i];
                pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);
            }

            pmCollection.areLoaded = true;
        });
    },

    // Get collection by folder ID
    getCollectionForFolderId: function(id) {
        function existingFolderFinder(r) {
            return r.id === id;
        }

        for(var i = 0; i < this.length; i++) {
            var collection = this.models[i];
            var folders = collection.get("folders");
            var folder = _.find(folders, existingFolderFinder);
            if (folder) {
                return collection;
            }
        }

        return null;
    },

    // Add collection
    addCollection:function (name) {
        var pmCollection = this;

        var collection = {};

        if (name) {
            collection.id = guid();
            collection.name = name;
            collection.order = [];
            pm.indexedDB.addCollection(collection, function (collection) {                
                pmCollection.add(collection, {merge: true});                
            });

        }
    },

    // Add collection data to the database
    addCollectionDataToDB:function(collection, toSyncWithDrive) {
        var pmCollection = this;
        var folders;
        var folder;
        var order;
        var j, count;
        var idHashTable = {};

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
                idHashTable[request.id] = newId;
                
                if (ordered) {
                    var currentId = request.id;
                    var loc = _.indexOf(collection["order"], currentId);
                    dbCollection["order"][loc] = newId;
                }                

                request.id = newId;

                if ("responses" in request) {                    
                    for (j = 0, count = request["responses"].length; j < count; j++) {
                        request["responses"][j].id = guid();
                        request["responses"][j].collectionRequestId = newId;
                    }
                }

                pm.indexedDB.addCollectionRequest(request, onAddCollectionRequest);
                requests.push(request);
            }

            if ("folders" in collection) {
                folders = collection["folders"];

                for(i = 0; i < folders.length; i++) {
                    folders[i].id = guid();
                    order = folders[i].order;
                    for(j = 0; j < order.length; j++) {
                        order[j] = idHashTable[order[j]];
                    }

                }
            }

            pm.indexedDB.updateCollection(dbCollection, function() {});            

            var c = new PmCollection(dbCollection);
            c.setRequests(requests);
            pmCollection.add(c, {merge: true});
        });
    },

    // Update collection
    updateCollection: function(collection) {
        var pmCollection = this;

        pm.indexedDB.updateCollection(collection, function (collection) {
            function onGetAllRequestsInCollection(collection, requests) {                
                var c = new PmCollection(collection);
                c.setRequests(requests);
                pmCollection.add(c, {merge: true});                
                pm.collections.drive.queueUpdateFromId(c.id);
            }

            pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);            
        });
    },

    updateCollectionOrder: function(id, order) {
        var pmCollection = this;

        var targetCollection = pmCollection.get(id);
        targetCollection.set("order", order);

        pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function (collection) {            
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

    // Remove collection
    deleteCollection:function (id, toSyncWithDrive, callback) {
        var pmCollection = this;

        pm.indexedDB.deleteCollection(id, function () {
            pmCollection.remove(id);

            if (callback) {
                callback();    
            }            
        });
    },

    // Get collection data for file
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

    // Save collection as a file
    saveCollection:function (id) {
        this.getCollectionData(id, function (name, type, filedata) {
            var filename = name + ".postman_collection";
            console.log(filedata);
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

    // Upload collection
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

    // Overwrite collection
    overwriteCollection:function(originalCollectionId, collection) {
        this.deleteCollection(originalCollectionId, true);
        this.addCollectionDataToDB(collection, true);
    },

    // Duplicate collection
    duplicateCollection:function(collection) {
        this.addCollectionDataToDB(collection, true);
    },
    
    // Merge collection
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

    // Merge multiple collections
    mergeCollections: function (collections) {
        var pmCollection = this;

        var size = collections.length;
        for(var i = 0; i < size; i++) {
            var collection = collections[i];
            pmCollection.mergeCollection(collection, true);
        }
    },

    // Import collection
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

    // Import multiple collections
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

    // Get request by ID
    getRequestById: function(id) {
        function existingRequestFinder(r) {
            return r.id === id;
        }

        for(var i = 0; i < this.models.length; i++) {
            var collection = this.models[i];

            var requests = collection.get("requests");
            var request = _.find(requests, existingRequestFinder);
            if (request) {
                return request;
            }
        }

        return null;
    },

    // Load collection request
    loadCollectionRequest:function (id) {
        var pmCollection = this;
        
        pm.indexedDB.getCollectionRequest(id, function (request) {
            request.isFromCollection = true;
            request.collectionRequestId = id;
            pm.request.loadRequestInEditor(request, true);
            pmCollection.trigger("selectedCollectionRequest", request);
        });
    },    

    // Add request to collection
    addRequestToCollection:function (collectionRequest, collection) {
        var pmCollection = this;

        if (collection.name) {
            collection.requests = [];
            collection.order = [collectionRequest.id];

            pm.indexedDB.addCollection(collection, function (newCollection) {
                pmCollection.add(newCollection, {merge: true});
                collectionRequest.collectionId = newCollection.id;

                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {                    
                    pm.urlCache.addUrl(req.url);

                    var c = pmCollection.get(collection.id);
                    c.get("requests").push(req);
                    pmCollection.trigger("addCollectionRequest", req);

                    //TODO Fix this
                    pmCollection.loadCollectionRequest(req.id);

                    pm.collections.drive.queuePost(collectionRequest.collectionId);
                });
            });

        }
        else {
            collectionRequest.collectionId = collection.id;
            pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {  
                pm.urlCache.addUrl(req.url);

                pm.indexedDB.getCollection(collection.id, function(newCollection) {                    
                    //TODO Fix this
                    pmCollection.loadCollectionRequest(req.id);

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

    // Add request to folder
    addRequestToFolder: function(collectionRequest, collectionId, folderId) {
        var pmCollection = this;

        var collection = this.get(collectionId);
        collectionRequest.collectionId = collectionId;

        pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
            collection.get("requests").push(req);
            pmCollection.moveRequestToFolder(req.id, folderId);
            pmCollection.loadCollectionRequest(req.id);
        });
    },            

    // Update collection request
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

    // Delete collection request
    deleteCollectionRequest:function (id, callback) {
        var pmCollection = this;
        var request = this.getRequestById(id);
        var targetCollection = this.get(request.collectionId);

        pm.indexedDB.deleteCollectionRequest(id, function () {
            targetCollection.deleteRequest(id);
            collection = targetCollection.getAsJSON();                        
            pm.indexedDB.updateCollection(collection, function (collection) {    
                pmCollection.trigger("removeCollectionRequest", request);

                if(callback) {
                    callback();
                }
                // TODO: Drive syncing will be done later
                // pm.collections.drive.queueUpdateFromId(collection.id);
            });            
        });        
    },


    
    moveRequestToFolder: function(requestId, targetFolderId) {
        var pmCollection = this;
        var request = _.clone(this.getRequestById(requestId));
        var folder = this.getFolderById(targetFolderId);        
        var targetCollection = this.getCollectionForFolderId(targetFolderId);

        if(targetCollection.id === request.collectionId) {            
            targetCollection.addRequestIdToFolder(folder.id, request.id);
            pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function() {                
                pmCollection.trigger("moveRequestToFolder", targetCollection, folder, request);                
            });        
        }
        else {
            // Different collection
            
            this.deleteCollectionRequest(requestId, function() {
                request.id = guid();
                request.collectionId = targetCollection.get("id");

                pm.indexedDB.addCollectionRequest(request, function (req) {
                    targetCollection.addRequestIdToFolder(folder.id, req.id);
                    var collection = targetCollection.getAsJSON();
                    pm.indexedDB.updateCollection(collection, function() {                    
                        targetCollection.get("requests").push(req);                        
                        pmCollection.trigger("moveRequestToFolder", targetCollection, folder, request);                                        
                    });
                });
            });            
            
        }        
    },

    moveRequestToCollection: function(requestId, targetCollectionId) {
        var pmCollection = this;
        var targetCollection = this.get(targetCollectionId);        
        var request = _.clone(this.getRequestById(requestId));       

        if(targetCollectionId === request.collectionId) {            
            targetCollection.addRequestIdToOrder(request.id);
            
            pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function() {
                pmCollection.trigger("moveRequestToCollection", targetCollection, request);
            });
        }
        else {
            var oldCollection = this.get(request.collectionId);
            this.deleteCollectionRequest(requestId, function() {
                request.id = guid();
                request.collectionId = targetCollectionId;            
                targetCollection.get("requests").push(request);

                pm.indexedDB.addCollectionRequest(request, function (req) {
                    targetCollection.addRequestIdToOrder(request.id);
                    var collection = targetCollection.getAsJSON();
                    pm.indexedDB.updateCollection(collection, function() {                        
                        pmCollection.trigger("moveRequestToCollection", targetCollection, request);
                    });
                });
            });            
        }        
    },

    // Get folder by ID
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

    addFolder: function(parentId, folderName) {
        var collection = this.get(parentId);

        var newFolder = {
            "id": guid(),
            "name": folderName,
            "description": "",
            "order": []
        };

        collection.addFolder(newFolder);
        this.trigger("addFolder", collection, newFolder);
        this.updateCollection(collection.getAsJSON());
    },

    updateFolderOrder: function(collectionId, folderId, order) {
        var folder = this.getFolderById(folderId);
        folder.order = order;
        var collection = this.get(collectionId);
        collection.editFolder(folder);

        this.updateCollection(collection.getAsJSON());        
    },

    updateFolderMeta: function(id, name) {
        var folder = this.getFolderById(id);
        folder.name = name;
        var collection = this.getCollectionForFolderId(id);
        collection.editFolder(folder);        
        this.trigger("updateFolder", collection, folder);
        this.updateCollection(collection.getAsJSON());
    },

    deleteFolder: function(id) {
        var collection = this.getCollectionForFolderId(id);
        collection.deleteFolder(id);
        this.trigger("deleteFolder", collection, id);
        this.updateCollection(collection.getAsJSON());
    },

    filter: function(term) {
        term = term.toLowerCase();
        var collections = this.toJSON();
        var collectionCount = collections.length;
        var filteredCollections = [];
        var name;
        var requests;
        var requestsCount;
        var i, j, k, c, r, f;
        var folders;
        var folderOrder;
        var visibleRequestHash = {};

        for(i = 0; i < collectionCount; i++) {
            c = {
                id: collections[i].id,
                name: collections[i].name,
                requests: [],
                folders: [],
                toShow: false,
            };

            name = collections[i].name.toLowerCase();

            if (name.search(term) >= 0) {
                c.toShow = true;
            }

            requests = collections[i].requests;            

            if (requests) {
                requestsCount = requests.length;

                for(j = 0; j < requestsCount; j++) {
                    r = {
                        id: requests[j].id,
                        name: requests[j].name,
                        toShow: false
                    };                    

                    name = requests[j].name.toLowerCase();

                    if (name.search(term) >= 0) {
                        r.toShow = true;
                        c.toShow = true;
                        visibleRequestHash[r.id] = true;                        
                    }
                    else {
                        r.toShow = false;
                        visibleRequestHash[r.id] = false;
                    }

                    c.requests.push(r);
                }
            }

            if("folders" in collections[i]) {
                folders = collections[i].folders;
                for (j = 0; j < folders.length; j++) {
                    f = {
                        id: folders[j].id,
                        name: folders[j].name,
                        toShow: false
                    };                    

                    name = folders[j].name.toLowerCase();

                    if (name.search(term) >= 0) {
                        f.toShow = true;
                        c.toShow = true;                        
                    }
                    
                    folderOrder = folders[j].order;

                    // Check if any requests are to be shown
                    for(k = 0; k < folderOrder.length; k++) {
                        if (visibleRequestHash[folderOrder[k]] === true) {
                            f.toShow = true;
                            c.toShow = true;
                            break;
                        }
                    }

                    c.folders.push(f);
                }
            }

            filteredCollections.push(c);
        }

        this.trigger("filter", filteredCollections);
        return filteredCollections;
    },

    revert: function() {
        this.trigger("revertFilter");
    }    
});