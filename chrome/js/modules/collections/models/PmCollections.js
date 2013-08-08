var PmCollections = Backbone.Collection.extend({
    //TODO Needs to be refactored
    originalCollectionId: "",
    toBeImportedCollection:{},

    model: PmCollection,

    isLoaded: false,
    initializedSyncing: false,
    syncFileTypeCollection: "collection",
    syncFileTypeCollectionRequest: "collection_request",

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
        this.loadAllCollections();
    },

    // TODO Add sync related calls
    // Load all collections
    loadAllCollections:function () {
        var pmCollection = this;

        this.startListeningForFileSystemSyncEvents();

        pm.indexedDB.getCollections(function (items) {
            var itemsLength = items.length;
            var loaded = 0;

            function onGetAllRequestsInCollection(collection, requests) {
                var c = new PmCollection(collection);
                c.setRequests(requests);
                pmCollection.add(c, {merge: true});

                console.log("PmCollections", c.toJSON());

                loaded++;

                for(var i = 0; i < requests.length; i++) {
                    pm.urlCache.addUrl(requests[i].url);
                }

                if (loaded === itemsLength) {
                    console.log("PmCollections", "Starting sync");
                    pmCollection.isLoaded = true;
                    pmCollection.trigger("startSync");
                }
            }

            if (itemsLength === 0) {
                pmCollection.isLoaded = true;
                pmCollection.trigger("startSync");
            }
            else {
                for (var i = 0; i < itemsLength; i++) {
                    var collection = items[i];
                    console.log("PmCollections", "Stored collection is ",  collection);
                    pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);
                }
            }


        });
    },

    startListeningForFileSystemSyncEvents: function() {
        var pmCollection = this;
        var isLoaded = pmCollection.isLoaded;
        var initializedSyncing = pmCollection.initializedSyncing;

        pm.mediator.on("initializedSyncableFileSystem", function() {
            pmCollection.initializedSyncing = true;
            pmCollection.trigger("startSync");
        });

        this.on("startSync", this.startSyncing, this);
    },

    startSyncing: function() {
        var i;
        var j;
        var pmCollection = this;
        var collection;
        var requests;
        var request;
        var synced;
        var syncableFile;

        // TODO Add additional checks for collection_request
        if (this.isLoaded && this.initializedSyncing) {
            console.log("PmCollections", "Start syncing collections");

            pm.mediator.on("addSyncableFileFromRemote", function(type, data) {
                console.log("PmCollections", type, data);
                if (type === "collection") {
                    pmCollection.onReceivingSyncableFileData(data);
                }
                else if (type === "collection_request") {
                    pmCollection.onReceivingSyncableFileDataForRequests(data);
                }
            });

            pm.mediator.on("updateSyncableFileFromRemote", function(type, data) {
                console.log("PmCollections", type, data);
                if (type === "collection") {
                    pmCollection.onReceivingSyncableFileData(data);
                }
                else if (type === "collection_request") {
                    pmCollection.onReceivingSyncableFileDataForRequests(data);
                }
            });

            pm.mediator.on("deleteSyncableFileFromRemote", function(type, id) {
                if (type === "collection") {
                    pmCollection.onRemoveSyncableFile(id);
                }
                else if (type === "collection_request") {
                    pmCollection.onRemoveSyncableFileForRequests(id);
                }
            });

            // And this
            for(i = 0; i < this.models.length; i++) {
                collection = this.models[i];
                synced = collection.get("synced");

                if (!synced) {
                    console.log("PmCollections", "Collection is not synced");
                    this.addToSyncableFilesystem(collection.get("id"));
                }

                requests = collection.get("requests");

                console.log("PmCollections", "Collection requests are ", requests);

                for(j = 0; j < requests.length; j++) {
                    var request = requests[j];

                    if (request.hasOwnProperty("synced")) {
                        if (!request.synced) {
                            console.log("PmCollections", "Request is not synced. Synced contained", request);
                            this.addRequestToSyncableFilesystem(request.id);
                        }
                    }
                    else {
                        console.log("PmCollections", "Request is not synced", request);
                        this.addRequestToSyncableFilesystem(request.id);
                    }
                }
            }
        }
        else {
            console.log("PmCollections", "Either collection not loaded or not initialized syncing");
        }
    },

    onReceivingSyncableFileData: function(data) {
        var collection = JSON.parse(data);
        console.log("PmCollections", "Received data", collection);
        this.addCollectionFromSyncableFileSystem(collection);
    },

    onRemoveSyncableFile: function(id) {
        console.log("PmCollections", "Received deleted id", id);
        this.deleteCollection(id, true);
    },

    onReceivingSyncableFileDataForRequests: function(data) {
        console.log("PmCollections", "Received data", data);
        var request = JSON.parse(data);
        console.log("PmCollections", "Received data. Do something with this", request);
        this.addRequestFromSyncableFileSystem(request);
    },

    onRemoveSyncableFileForRequests: function(id) {
        console.log("PmCollections", "Received deleted id", id);
        this.deleteCollectionRequest(id, function() {
            console.log("PmCollections", "Deleted collection request");
        }, true);
    },

    getAsSyncableFile: function(id) {
        var collection = this.get(id);
        var name = id + ".collection";
        var type = "collection";

        console.log("PmCollections", "Syncable file is ", collection.toSyncableJSON());

        var data = JSON.stringify(collection.toSyncableJSON());

        return {
            "name": name,
            "type": type,
            "data": data
        };
    },

    getRequestAsSyncableFile: function(id) {
        var request = this.getRequestById(id);
        var name = id + ".collection_request";
        var type = "collection_request";

        request.synced = true;

        var data = JSON.stringify(request);

        return {
            "name": name,
            "type": type,
            "data": data
        };
    },

    addToSyncableFilesystem: function(id) {
        var pmCollection = this;

        var syncableFile = this.getAsSyncableFile(id);
        pm.mediator.trigger("addSyncableFile", syncableFile, function(result) {
            console.log("PmCollections", "Updated collection sync status");
            if(result === "success") {
                console.log("PmCollections", "Update local sync status");
                pmCollection.updateCollectionSyncStatus(id, true);
            }
        });
    },

    removeFromSyncableFilesystem: function(id) {
        var name = id + ".collection";
        pm.mediator.trigger("removeSyncableFile", name, function(result) {
            console.log("PmCollections", "Removed file");
        });
    },

    addRequestToSyncableFilesystem: function(id) {
        var pmCollection = this;

        var syncableFile = this.getRequestAsSyncableFile(id);
        pm.mediator.trigger("addSyncableFile", syncableFile, function(result) {
            console.log("PmCollections", "Updated collection sync status");
            if(result === "success") {
                console.log("PmCollections", "Update local sync status");
                pmCollection.updateCollectionRequestSyncStatus(id, true);
            }
        });
    },

    removeRequestFromSyncableFilesystem: function(id) {
        var name = id + ".collection_request";
        pm.mediator.trigger("removeSyncableFile", name, function(result) {
            console.log("PmCollections", "Removed file");
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

    // TODO call to addToSyncableFilesystem
    // Add collection
    addCollection:function (name, doNotSync) {
        var pmCollection = this;

        var collection = {};

        if (name) {
            collection.id = guid();
            collection.name = name;
            collection.order = [];
            collection.timestamp = new Date().getTime();

            pm.indexedDB.addCollection(collection, function (collection) {
                pmCollection.add(collection, {merge: true});

                if (!doNotSync) {
                    pmCollection.addToSyncableFilesystem(collection.id);
                }
            });

        }
    },

    addCollectionFromSyncableFileSystem:function (collection) {
        console.log("PmCollections", "Received collection from drive sync", collection);

        var pmCollection = this;

        pm.indexedDB.addCollection(collection, function (collection) {
            function onGetAllRequestsInCollection(collection, requests) {
                var c = new PmCollection(collection);
                c.setRequests(requests);
                c.set("synced", true);
                pmCollection.add(c, {merge: true});

                for(var i = 0; i < requests.length; i++) {
                    pm.urlCache.addUrl(requests[i].url);
                }

                console.log("PmCollections", "Updated collection is ", collection);
                pmCollection.trigger("updateCollection", c);
            }

            pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);
        });
    },

    addRequestFromSyncableFileSystem: function(request) {
        var pmCollection = this;

        pm.indexedDB.addCollectionRequest(request, function (req) {
            pm.urlCache.addUrl(request.url);

            var collection = pmCollection.get(request.collectionId);

            if (collection) {
                var requestIndex = collection.getRequestIndex(request);

                if (requestIndex === -1) {
                    collection.addRequest(request);
                }
                else {
                    collection.updateRequest(request);
                }

                pmCollection.trigger("updateCollection", collection);
            }
        });
    },

    // TODO call to addToSyncableFilesystem
    // Add collection data to the database with new IDs
    addAsNewCollection:function(collection, doNotSync) {
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
                //Add drive sync code
                if (!doNotSync) {
                    pmCollection.addRequestToSyncableFilesystem(req.id);
                }
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

            pm.indexedDB.updateCollection(dbCollection, function() {
                if (!doNotSync) {
                    pmCollection.addToSyncableFilesystem(collection.id);
                }
            });

            var c = new PmCollection(dbCollection);
            c.setRequests(requests);
            pmCollection.add(c, {merge: true});
        });
    },

    // TODO call to addToSyncableFilesystem
    // Update collection
    updateCollection: function(collection, doNotSync) {
        var pmCollection = this;

        pm.indexedDB.updateCollection(collection, function (collection) {
            function onGetAllRequestsInCollection(collection, requests) {
                var c = new PmCollection(collection);
                c.setRequests(requests);
                pmCollection.add(c, {merge: true});

                if (!doNotSync) {
                    pmCollection.addToSyncableFilesystem(collection.id);
                }
            }

            pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);
        });
    },

    // TODO call to addToSyncableFilesystem
    updateCollectionOrder: function(id, order, doNotSync) {
        var pmCollection = this;

        var targetCollection = pmCollection.get(id);
        targetCollection.set("order", order);

        pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function (collection) {
            if (!doNotSync) {
                pmCollection.addToSyncableFilesystem(collection.id);
            }
        });
    },

    updateCollectionSyncStatus: function(id, status) {
        var pmCollection = this;

        var targetCollection = pmCollection.get(id);
        targetCollection.set("synced", status);

        pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function (collection) {
            console.log("PmCollections", "Update collection sync status", status);
        });
    },

    // TODO call to addToSyncableFilesystem
    updateCollectionMeta: function(id, name, doNotSync) {
        var pmCollection = this;

        pm.indexedDB.getCollection(id, function (collection) {
            collection.name = name;
            pm.indexedDB.updateCollection(collection, function (collection) {
                pmCollection.add(collection, {merge: true});
                pmCollection.trigger("updateCollectionMeta", collection);

                if (!doNotSync) {
                    pmCollection.addToSyncableFilesystem(collection.id);
                }
            });
        });
    },

    // TODO call to removeFromSyncableFilesystem
    // Remove collection
    deleteCollection:function (id, doNotSync, callback) {
        var pmCollection = this;

        pm.indexedDB.deleteCollection(id, function () {
            // Call deleteCollectionRequest
            function onGetAllRequestsInCollection(requests) {
                var deleted = 0;
                var requestCount = requests.length;
                var request;

                if (requestCount > 0) {
                    for(var i = 0; i < requests.length; i++) {
                        request = requests[i];

                        pm.indexedDB.deleteCollectionRequest(request.id, function (requestId) {
                            deleted++;

                            if (!doNotSync) {
                                pmCollection.removeRequestFromSyncableFilesystem(requestId);
                            }

                            if (deleted === requestCount) {
                                pmCollection.remove(id);

                                if (!doNotSync) {
                                    pmCollection.removeFromSyncableFilesystem(id);
                                }

                                console.log("All requests removed, now removing collection");

                                if (callback) {
                                    callback();
                                }
                            }
                        });
                    }
                }
                else {
                    pmCollection.remove(id);

                    if (!doNotSync) {
                        pmCollection.removeFromSyncableFilesystem(id);
                    }

                    console.log("All requests removed, now removing collection");

                    if (callback) {
                        callback();
                    }
                }

            }

            pm.indexedDB.getAllRequestsForCollectionId(id, onGetAllRequestsInCollection);
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

    // Save collection as a file
    saveCollection:function (id) {
        this.getCollectionData(id, function (name, type, filedata) {
            var filename = name + ".postman_collection";
            console.log("PmCollections", filedata);
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
        this.deleteCollection(originalCollectionId);
        this.addAsNewCollection(collection);
    },

    // Duplicate collection
    duplicateCollection:function(collection) {
        this.addAsNewCollection(collection);
    },

    // TODO Refactor this. Just use the default functions
    // Merge collection
    // Being used in IndexedDB bulk import
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

    // Merge multiple collections. Used in bulk data import
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
            this.addAsNewCollection(collection);
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

            console.log("PmCollections", requests, id);

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

    // TODO call to addToSyncableFilesystem
    // Add request to collection
    addRequestToCollection:function (collectionRequest, collection, doNotSync) {
        var pmCollection = this;

        if (collection.name) {
            collection.requests = [];
            collection.order = [collectionRequest.id];
            collection.timestamp = new Date().getTime();

            pm.indexedDB.addCollection(collection, function (newCollection) {
                pmCollection.add(newCollection, {merge: true});

                collectionRequest.collectionId = newCollection.id;

                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                    pm.urlCache.addUrl(req.url);

                    var c = pmCollection.get(collection.id);
                    c.get("requests").push(req);
                    pmCollection.add(c, {merge: true});

                    pmCollection.trigger("addCollectionRequest", req);

                    if (!doNotSync) {
                        pmCollection.addRequestToSyncableFilesystem(collectionRequest.id);
                        pmCollection.addToSyncableFilesystem(newCollection.id);
                    }

                    //TODO Fix this
                    pmCollection.loadCollectionRequest(req.id);
                });
            });

        }
        else {
            collectionRequest.collectionId = collection.id;
            pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                pm.urlCache.addUrl(req.url);

                pm.indexedDB.getCollection(collection.id, function(newCollection) {
                    if("order" in newCollection) {
                        newCollection["order"].push(req.id);
                    }
                    else {
                        newCollection["order"] = [req.id];
                    }

                    pmCollection.loadCollectionRequest(req.id);

                    var c = pmCollection.get(newCollection.id);
                    c.get("requests").push(req);
                    c.set("order", newCollection["order"]);

                    pmCollection.trigger("addCollectionRequest", req);

                    pm.indexedDB.updateCollection(newCollection, function() {
                        console.log("PmCollections", "Updating collection", newCollection);

                        if (!doNotSync) {
                            pmCollection.addRequestToSyncableFilesystem(collectionRequest.id);
                            pmCollection.addToSyncableFilesystem(newCollection.id);
                        }
                    });

                });
            });
        }

        this.trigger("updateCollectionRequest", collectionRequest);
    },


    // TODO call to addToSyncableFilesystem
    // Add request to folder
    addRequestToFolder: function(collectionRequest, collectionId, folderId) {
        var pmCollection = this;

        var collection = this.get(collectionId);
        collectionRequest.collectionId = collectionId;

        pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
            collection.get("requests").push(req);
            pmCollection.addRequestToSyncableFilesystem(req.id);
            pmCollection.moveRequestToFolder(req.id, folderId);
            pmCollection.loadCollectionRequest(req.id);
        });
    },

    // TODO call to addToSyncableFilesystem
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

                pmCollection.addRequestToSyncableFilesystem(req.id);

                var c = pmCollection.get(collectionRequest.collectionId);
                c.updateRequest(collectionRequest);

                pmCollection.trigger("updateCollectionRequest", request);
            });
        });
    },

    // TODO call to addToSyncableFilesystem
    updateCollectionRequestMeta: function(id, name, description) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(id, function (req) {
            req.name = name;
            req.description = description;
            pm.indexedDB.updateCollectionRequest(req, function (newRequest) {
                var c = pmCollection.get(newRequest.collectionId);
                c.updateRequest(newRequest);

                pmCollection.addRequestToSyncableFilesystem(req.id);

                pmCollection.trigger("updateCollectionRequest", newRequest);
            });
        });
    },

    updateCollectionRequestSyncStatus: function(id, name, description) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(id, function (req) {
            req.synced = true;

            pm.indexedDB.updateCollectionRequest(req, function (newRequest) {
                var c = pmCollection.get(newRequest.collectionId);
                c.updateRequest(newRequest);
            });
        });
    },

    // TODO call to removeFromSyncableFilesystem
    // Delete collection request
    deleteCollectionRequest:function (id, callback, doNotSync) {
        var pmCollection = this;
        var request = this.getRequestById(id);
        var targetCollection;

        if (request) {
            targetCollection = this.get(request.collectionId);
        }

        pm.indexedDB.deleteCollectionRequest(id, function () {
            if (targetCollection) {
                targetCollection.deleteRequest(id);
                collection = targetCollection.getAsJSON();
                pm.indexedDB.updateCollection(collection, function (collection) {
                    console.log("PmCollections", "Removing collection request");

                    pmCollection.trigger("removeCollectionRequest", request);

                    if (!doNotSync) {
                        pmCollection.removeRequestFromSyncableFilesystem(request.id);
                        pmCollection.addToSyncableFilesystem(collection.id);
                    }

                    if(callback) {
                        callback();
                    }
                });
            }
            else {
                if (!doNotSync) {
                    pmCollection.removeRequestFromSyncableFilesystem(request.id);
                }

                if(callback) {
                    callback();
                }
            }
        });
    },

    // TODO call to addToSyncableFilesystem
    // TODO call to removeFromSyncableFilesystem
    moveRequestToFolder: function(requestId, targetFolderId, doNotSync) {
        var pmCollection = this;
        var request = _.clone(this.getRequestById(requestId));
        var folder = this.getFolderById(targetFolderId);
        var targetCollection = this.getCollectionForFolderId(targetFolderId);

        if(targetCollection.id === request.collectionId) {
            targetCollection.addRequestIdToFolder(folder.id, request.id);
            pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function() {
                pmCollection.trigger("moveRequestToFolder", targetCollection, folder, request);

                if (!doNotSync) {
                    pmCollection.addToSyncableFilesystem(targetCollection.get("id"));
                }
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

                        if (!doNotSync) {
                            pmCollection.addRequestToSyncableFilesystem(req.id);
                            pmCollection.addToSyncableFilesystem(targetCollection.get("id"));
                        }

                    });
                });
            });

        }
    },

    // TODO call to addToSyncableFilesystem
    // TODO call to removeFromSyncableFilesystem
    moveRequestToCollection: function(requestId, targetCollectionId) {
        var pmCollection = this;
        var targetCollection = this.get(targetCollectionId);
        var request = _.clone(this.getRequestById(requestId));

        if(targetCollectionId === request.collectionId) {
            targetCollection.addRequestIdToOrder(request.id);

            pm.indexedDB.updateCollection(targetCollection.getAsJSON(), function() {
                pmCollection.trigger("moveRequestToCollection", targetCollection, request);
                pmCollection.addRequestToSyncableFilesystem(req.id);
                pmCollection.addToSyncableFilesystem(targetCollection.get("id"));
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
                        pmCollection.addRequestToSyncableFilesystem(req.id);
                        pmCollection.addToSyncableFilesystem(targetCollection.get("id"));
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