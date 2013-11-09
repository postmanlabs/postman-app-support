var PmCollections = Backbone.Collection.extend({
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

        pm.mediator.on("addDirectoryCollection", this.onAddDirectoryCollection, this);
        pm.mediator.on("addResponseToCollectionRequest", this.addResponseToCollectionRequest, this);
        pm.mediator.on("updateResponsesForCollectionRequest", this.updateResponsesForCollectionRequest, this);
        pm.mediator.on("deletedSharedCollection", this.onDeletedSharedCollection, this);
        pm.mediator.on("overwriteCollection", this.onOverwriteCollection, this);
        pm.mediator.on("uploadAllLocalCollections", this.onUploadAllLocalCollections, this);
    },

    onUploadAllLocalCollections: function() {
        console.log("Uploading all local collections");

        var uploaded = 0;
        var count = this.models.length;

        function callback() {
            console.log("Uploaded collection");
            uploaded++;

            if (uploaded === count) {
                console.log("Uploaded all collections");
                pm.mediator.trigger("refreshSharedCollections");
            }
        }

        for(var i = 0; i < this.models.length; i++) {
            this.uploadCollection(this.models[i].get("id"), false, false, callback);
        }
    },

    getAllCollections: function() {
        return this.models;
    },

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

                loaded++;

                for(var i = 0; i < requests.length; i++) {
                    pm.mediator.trigger("addToURLCache", requests[i].url);
                }

                if (loaded === itemsLength) {
                    pmCollection.isLoaded = true;
                    pmCollection.trigger("startSync");

                    pm.mediator.trigger("refreshCollections");
                }
            }

            if (itemsLength === 0) {
                pmCollection.isLoaded = true;
                pmCollection.trigger("startSync");
            }
            else {
                for (var i = 0; i < itemsLength; i++) {
                    var collection = items[i];
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

        if (this.isLoaded && this.initializedSyncing) {

            pm.mediator.on("addSyncableFileFromRemote", function(type, data) {
                if (type === "collection") {
                    pmCollection.onReceivingSyncableFileData(data);
                }
                else if (type === "collection_request") {
                    pmCollection.onReceivingSyncableFileDataForRequests(data);
                }
            });

            pm.mediator.on("updateSyncableFileFromRemote", function(type, data) {
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
                    this.addToSyncableFilesystem(collection.get("id"));
                }

                requests = collection.get("requests");

                for(j = 0; j < requests.length; j++) {
                    request = requests[j];

                    if (request.hasOwnProperty("synced")) {
                        if (!request.synced) {
                            this.addRequestToSyncableFilesystem(request.id);
                        }
                    }
                    else {
                        this.addRequestToSyncableFilesystem(request.id);
                    }
                }
            }
        }
        else {
        }
    },

    onReceivingSyncableFileData: function(data) {
        var collection = JSON.parse(data);
        this.addCollectionFromSyncableFileSystem(collection);
    },

    onRemoveSyncableFile: function(id) {
        this.deleteCollectionFromDataStore(id, false, function() {
        });
    },

    onReceivingSyncableFileDataForRequests: function(data) {
        var request = JSON.parse(data);
        this.addRequestFromSyncableFileSystem(request);
    },

    onRemoveSyncableFileForRequests: function(id) {
        this.deleteRequestFromDataStore(id, false, false, function() {
        });
    },

    onOverwriteCollection: function(collection) {
        console.log("Collection data is", collection);
        this.overwriteCollection(collection.id, collection);
    },

    onDeletedSharedCollection: function(collection) {
        console.log("Deleted shared collection", collection);
        var c;
        var pmCollection = this;

        for(var i = 0; i < this.models.length; i++) {
            var c = this.models[i];
            if (c.get("remote_id") === collection.remote_id) {
                c.set("remote_id", 0);
                pmCollection.updateCollectionInDataStore(c.getAsJSON(), true, function (c) {
                });
                break;
            }
        }
    },

    getAsSyncableFile: function(id) {
        var collection = this.get(id);
        var name = id + ".collection";
        var type = "collection";

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
            if(result === "success") {
                pmCollection.updateCollectionSyncStatus(id, true);
            }
        });
    },

    removeFromSyncableFilesystem: function(id) {
        var name = id + ".collection";
        pm.mediator.trigger("removeSyncableFile", name, function(result) {
        });
    },

    addRequestToSyncableFilesystem: function(id) {
        var pmCollection = this;

        var syncableFile = this.getRequestAsSyncableFile(id);
        pm.mediator.trigger("addSyncableFile", syncableFile, function(result) {
            if(result === "success") {
                pmCollection.updateCollectionRequestSyncStatus(id, true);
            }
        });
    },

    removeRequestFromSyncableFilesystem: function(id) {
        var name = id + ".collection_request";
        pm.mediator.trigger("removeSyncableFile", name, function(result) {
        });
    },

    /* Base data store functions*/
    addCollectionToDataStore: function(collectionJSON, sync, callback) {
        var pmCollection = this;

        pm.indexedDB.addCollection(collectionJSON, function (c) {
            var collection = new PmCollection(c);

            pmCollection.add(collection, {merge: true});

            pm.mediator.trigger("refreshCollections");


            if (sync) {
                pmCollection.addToSyncableFilesystem(collection.get("id"));
            }

            if (callback) {
                callback(c);
            }
        });
    },

    updateCollectionInDataStore: function(collectionJSON, sync, callback) {
        var pmCollection = this;

        pm.indexedDB.updateCollection(collectionJSON, function (c) {
            var collection = pmCollection.get(c.id);
            pmCollection.add(collection, {merge: true});

            pm.mediator.trigger("refreshCollections");

            if (sync) {
                pmCollection.addToSyncableFilesystem(collection.get("id"));
            }

            if (callback) {
                callback(c);
            }
        });
    },

    deleteCollectionFromDataStore: function(id, sync, callback) {
        var pmCollection = this;

        pm.indexedDB.deleteCollection(id, function () {
            pmCollection.remove(id);

            if (sync) {
                pmCollection.removeFromSyncableFilesystem(id);
            }

            pm.indexedDB.getAllRequestsForCollectionId(id, function(requests) {
                var deleted = 0;
                var requestCount = requests.length;
                var request;
                var i;

                if (requestCount > 0) {
                    for(i = 0; i < requestCount; i++) {
                        request = requests[i];

                        pm.indexedDB.deleteCollectionRequest(request.id, function (requestId) {
                            deleted++;

                            if (sync) {
                                pmCollection.removeRequestFromSyncableFilesystem(requestId);
                            }

                            if (deleted === requestCount) {
                                pm.mediator.trigger("refreshCollections");
                                if (callback) {
                                    callback();
                                }
                            }
                        });
                    }
                }
                else {
                    if (callback) {
                        callback();
                    }
                }
            });
        });
    },

    addRequestToDataStore: function(request, sync, callback) {
        var pmCollection = this;

        pm.indexedDB.addCollectionRequest(request, function (req) {
            pm.mediator.trigger("addToURLCache", request.url);

            var collection = pmCollection.get(request.collectionId);

            if (collection) {
                collection.addRequest(request);
            }

            if (sync) {
                pmCollection.addRequestToSyncableFilesystem(request.id);
            }

            if (callback) {
                callback(request);
            }
        });
    },

    updateRequestInDataStore: function(request, sync, callback) {
        var pmCollection = this;

        if (!request.name) {
            request.name = request.url;
        }

        pm.indexedDB.updateCollectionRequest(request, function (req) {
            var collection = pmCollection.get(request.collectionId);

            if (collection) {
                collection.updateRequest(request);
            }

            if (sync) {
                pmCollection.addRequestToSyncableFilesystem(request.id);
            }

            if (callback) {
                callback(request);
            }
        });
    },

    deleteRequestFromDataStore: function(id, sync, syncCollection, callback) {
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

                if (sync) {
                    pmCollection.removeRequestFromSyncableFilesystem(id);
                }

                if(callback) {
                    callback();
                }

                // This is called because the request would be deleted from "order"
                pmCollection.updateCollectionInDataStore(collection, syncCollection, function(c) {
                });
            }
            else {
                if (sync) {
                    pmCollection.removeRequestFromSyncableFilesystem(id);
                }

                if(callback) {
                    callback();
                }
            }
        });
    },

    /* Finish base data store functions*/

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
    addCollection:function (name, description) {
        var pmCollection = this;

        var collection = {};

        if (name) {
            collection.id = guid();
            collection.name = name;
            collection.description = description;
            collection.order = [];
            collection.timestamp = new Date().getTime();

            pmCollection.addCollectionToDataStore(collection, true);
        }
    },

    addCollectionFromSyncableFileSystem:function (collection) {
        var pmCollection = this;

        pmCollection.addCollectionToDataStore(collection, false, function(c) {
            pm.indexedDB.getAllRequestsInCollection(c, function(c, requests) {
                var collectionModel = pmCollection.get(c.id);
                collectionModel.set("synced", true);
                collectionModel.setRequests(requests);
                pmCollection.trigger("updateCollection", collectionModel);
            });
        });
    },

    addRequestFromSyncableFileSystem: function(request) {
        var pmCollection = this;

        pmCollection.addRequestToDataStore(request, false, function(r) {
            var collectionModel = pmCollection.get(request.collectionId);
            var folderId;
            var folder;
            var requestLocation;

            if (collectionModel) {
                requestLocation = pmCollection.getRequestLocation(request.id);

                if (requestLocation.type === "collection") {
                    pmCollection.trigger("moveRequestToCollection", collectionModel, request);
                }
                else if (requestLocation.type === "folder") {
                    folder = pmCollection.getFolderById(requestLocation.folderId);
                    pmCollection.trigger("moveRequestToFolder", collectionModel, folder, request);
                }
            }

        });
    },

    // Add collection data to the database with new IDs
    addAsNewCollection:function(collection) {
        var pmCollection = this;
        var folders = [];
        var folder;
        var order;
        var j, count;
        var idHashTable = {};

        var dbCollection = _.clone(collection);
        dbCollection["requests"] = [];

        pmCollection.addCollectionToDataStore(dbCollection, true, function(c) {
            var collectionModel;
            var requests;
            var ordered;
            var i;
            var request;
            var newId;
            var currentId;
            var loc;

            collectionModel = pmCollection.get(c.id);

            // Shows successs message
            pmCollection.trigger("importCollection", {
                name:collection.name,
                action:"added"
            });

            requests = [];

            ordered = false;

            // Check against legacy collections which do not have an order
            if ("order" in collection) {
                ordered = true;
            }
            else {
                collection["order"] = [];
                collection.requests.sort(sortAlphabetical);
            }

            // Change ID of request - Also need to change collection order
            // and add request to indexedDB
            for (i = 0; i < collection.requests.length; i++) {
                request = collection.requests[i];
                request.collectionId = collection.id;

                var newId = guid();
                idHashTable[request.id] = newId;

                if (ordered) {
                    currentId = request.id;
                    loc = _.indexOf(collection["order"], currentId);
                    collection["order"][loc] = newId;
                }
                else {
                    collection["order"].push(newId);
                }

                request.id = newId;

                if ("responses" in request) {
                    for (j = 0, count = request["responses"].length; j < count; j++) {
                        request["responses"][j].id = guid();
                        request["responses"][j].collectionRequestId = newId;
                    }
                }

                requests.push(request);
            }

            // Change order inside folders with new IDs
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

            collectionModel.setRequests(requests);
            collectionModel.set("folders", folders);
            collectionModel.set("order", collection["order"]);


            // Check for remote_id

            if (pm.user.isLoggedIn()) {
                var remoteId = pm.user.getRemoteIdForCollection(c.id);
                collectionModel.set("remote_id", remoteId);
            }

            // Add new collection to the database
            pmCollection.updateCollectionInDataStore(collectionModel.getAsJSON(), true, function() {
                var i;
                var request;

                for (i = 0; i < requests.length; i++) {
                    request = requests[i];
                    pmCollection.addRequestToDataStore(request, true, function(r) {
                    });
                }

                pmCollection.trigger("updateCollection", collectionModel);
            });
        });
    },

    updateCollectionOrder: function(id, order) {
        var pmCollection = this;

        var targetCollection = pmCollection.get(id);
        targetCollection.set("order", order);

        pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function (collection) {
        });
    },

    updateCollectionSyncStatus: function(id, status) {
        var pmCollection = this;

        var targetCollection = pmCollection.get(id);
        targetCollection.set("synced", status);

        pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), false, function (collection) {
        });
    },

    updateCollectionMeta: function(id, name, description) {
        var pmCollection = this;

        var targetCollection = pmCollection.get(id);
        targetCollection.set("name", name);
        targetCollection.set("description", description);

        pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function (collection) {
            pmCollection.trigger("updateCollectionMeta", targetCollection);
        });
    },

    deleteCollection:function (id, sync, callback) {
        this.deleteCollectionFromDataStore(id, true, function() {
        });
    },

    // Get collection data for file
    getCollectionDataForFile:function (id, callback) {
        pm.indexedDB.getCollection(id, function (data) {
            var c = data;
            var i;
            var name;
            var type;
            var filedata;

            pm.indexedDB.getAllRequestsInCollection(c, function (collection, requests) {
                for (i = 0, count = requests.length; i < count; i++) {
                    requests[i]["synced"] = false;
                }

                if (collection.hasOwnProperty("remote_id")) {
                    delete collection['remote_id'];
                }

                //Get all collection requests with one call
                collection['synced'] = false;
                collection['requests'] = requests;

                name = collection['name'] + ".json";
                type = "application/json";

                filedata = JSON.stringify(collection);
                callback(name, type, filedata);
            });
        });
    },

    // Save collection as a file
    saveCollection:function (id) {
        this.getCollectionDataForFile(id, function (name, type, filedata) {
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

    // Upload collection
    uploadCollection:function (id, isPublic, refreshSharedCollections, callback) {
        var pmCollection = this;

        this.getCollectionDataForFile(id, function (name, type, filedata) {
            pm.api.uploadCollection(filedata, isPublic, function (data) {
                var link = data.link;

                if (callback) {
                    callback(link);
                }

                if (refreshSharedCollections) {
                    pm.mediator.trigger("refreshSharedCollections");
                }

                var collection = pmCollection.get(id);
                var remote_id = parseInt(data.id, 10);
                collection.set("remote_id", remote_id);
                pmCollection.updateCollectionInDataStore(collection.getAsJSON(), true, function (c) {
                });
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

    // Merge collection
    // Being used in IndexedDB bulk import
    mergeCollection: function(collection) {
        var pmCollection = this;

        //Update local collection
        var newCollection = {
            id: collection.id,
            name: collection.name,
            timestamp: collection.timestamp
        };

        var targetCollection;
        targetCollection = new PmCollection(newCollection);
        targetCollection.set("name", collection.name);

        if ("order" in collection) {
            targetCollection.set("order", collection.order);
        }

        if ("folders" in collection) {
            targetCollection.set("folders", collection.folders);
        }

        targetCollection.set("requests", collection.requests);

        pmCollection.add(targetCollection, {merge: true});

        pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function (c) {
            var driveCollectionRequests = collection.requests;

            pm.indexedDB.getAllRequestsInCollection(collection, function(collection, oldCollectionRequests) {
                var updatedRequests = [];
                var deletedRequests = [];
                var newRequests = [];
                var finalRequests = [];
                var i = 0;
                var driveRequest;
                var existingRequest;
                var sizeOldRequests;
                var loc;
                var j;
                var sizeUpdatedRequests;
                var sizeNewRequests;
                var sizeDeletedRequests;
                var size = driveCollectionRequests.length;

                function existingRequestFinder(r) {
                    return driveRequest.id === r.id;
                }

                for (i = 0; i < size; i++) {
                    driveRequest = driveCollectionRequests[i];
                    existingRequest = _.find(oldCollectionRequests, existingRequestFinder);

                    if (existingRequest) {
                        updatedRequests.push(driveRequest);

                        sizeOldRequests = oldCollectionRequests.length;
                        loc = -1;
                        for (j = 0; j < sizeOldRequests; j++) {
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

                sizeUpdatedRequests = updatedRequests.length;
                for(i = 0; i < sizeUpdatedRequests; i++) {
                    pmCollection.updateRequestInDataStore(updatedRequests[i], true);
                }

                sizeNewRequests = newRequests.length;
                for(i = 0; i < sizeNewRequests; i++) {
                    pmCollection.addRequestToDataStore(newRequests[i], true);
                }

                sizeDeletedRequests = deletedRequests.length;
                for(i = 0; i < sizeDeletedRequests; i++) {
                    pmCollection.deleteRequestFromDataStore(deletedRequests[i], true);
                }

                pmCollection.trigger("updateCollection", targetCollection);
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

    onAddDirectoryCollection: function(collection) {
        collection.id = guid();
        this.addAsNewCollection(collection);
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
                    try {
                        var collection = JSON.parse(data);
                        collection.id = guid();
                        pmCollection.importCollectionData(collection);
                    }
                    catch(e) {
                        pm.mediator.trigger("failedCollectionImport");
                    }
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    },

    importCollectionFromUrl:function (url) {
        var pmCollection = this;

        $.get(url, function (data) {
            try {
                var collection = data;
                collection.id = guid();
                pmCollection.importCollectionData(collection);
            }
            catch(e) {
                pm.mediator.trigger("failedCollectionImport");
            }

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

    getRequestLocation: function(id) {
        var i;
        var collection;
        var indexCollection;
        var folders;
        var indexFolder;

        for(var i = 0; i < this.models.length; i++) {
            collection = this.models[i];

            indexCollection = _.indexOf(collection.get("order"), id);

            if (indexCollection >= 0) {
                return {
                    "type": "collection",
                    "collectionId": collection.get("id")
                };
            }
            else {
                folders = collection.get("folders");
                for(j = 0; j < folders.length; j++) {
                    indexFolder = _.indexOf(folders[j].order, id);

                    if (indexFolder >= 0) {
                        return {
                            "type": "folder",
                            "folderId": folders[j].id,
                            "collectionId": collection.get("id")
                        };
                    }
                }
            }
        }

        return {
            "type": "not_found"
        };
    },

    // Load collection request in the editor
    loadCollectionRequest:function (id) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(id, function (request) {
            request.isFromCollection = true;
            request.collectionRequestId = id;
            pm.mediator.trigger("loadRequest", request, true);
            pmCollection.trigger("selectedCollectionRequest", request);
        });
    },

    // For the TCPReader. Not for the current request
    addRequestToCollectionId: function(collectionRequest, collectionId) {
        var pmCollection = this;

        collectionRequest.collectionId = collectionId;

        var targetCollection = pmCollection.get(collectionId);
        targetCollection.addRequestIdToOrder(collectionRequest.id);


        pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function() {
            pmCollection.addRequestToDataStore(collectionRequest, true, function(req) {
                pmCollection.trigger("addCollectionRequest", req);
            });
        });
    },

    // Add request to collection. For the current request
    addRequestToCollection:function (collectionRequest, collection) {
        console.log("Add request to collection", collectionRequest);

        var pmCollection = this;

        if (collection.name) {
            collection.requests = [];
            collection.order = [collectionRequest.id];
            collection.timestamp = new Date().getTime();

            pmCollection.addCollectionToDataStore(collection, true, function(newCollection) {
                collectionRequest.collectionId = newCollection.id;

                pmCollection.addRequestToDataStore(collectionRequest, true, function(req) {
                    pmCollection.trigger("addCollectionRequest", req);
                    pmCollection.loadCollectionRequest(req.id);
                });
            });
        }
        else {
            collectionRequest.collectionId = collection.id;

            var targetCollection = pmCollection.get(collection.id);
            targetCollection.addRequestIdToOrder(collectionRequest.id);


            pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function() {
                pmCollection.addRequestToDataStore(collectionRequest, true, function(req) {
                    pmCollection.trigger("addCollectionRequest", req);
                    pmCollection.loadCollectionRequest(req.id);
                });
            });
        }

        this.trigger("updateCollectionRequest", collectionRequest);
        pm.mediator.trigger("updateCollectionRequest", collectionRequest);
    },


    // Add request to folder
    addRequestToFolder: function(collectionRequest, collectionId, folderId) {
        var pmCollection = this;

        var collection = this.get(collectionId);
        collectionRequest.collectionId = collectionId;
        collection.addRequestIdToOrder(collectionRequest.id);

        pmCollection.addRequestToDataStore(collectionRequest, true, function(req) {
            pmCollection.moveRequestToFolder(req.id, folderId);
            pmCollection.loadCollectionRequest(req.id);
        });
    },


    addResponseToCollectionRequest: function(collectionRequestId, response) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(collectionRequestId, function (collectionRequest) {
            var responses;

            if (collectionRequest.hasOwnProperty("responses")) {
                responses = collectionRequest["responses"];
            }
            else {
                responses = [];
            }

            responses.push(response);

            pmCollection.updateRequestInDataStore(collectionRequest, true, function(request) {
                pmCollection.trigger("updateCollectionRequest", request);
                pm.mediator.trigger("updateCollectionRequest", request);
            });
        });
    },

    updateResponsesForCollectionRequest: function(collectionRequestId, responses) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(collectionRequestId, function (collectionRequest) {
            var c = _.clone(collectionRequest);
            c.responses = responses;
            pmCollection.updateRequestInDataStore(c, true, function(request) {
                pmCollection.trigger("updateCollectionRequest", request);
                pm.mediator.trigger("updateCollectionRequest", request);
            });
        });
    },

    // Update collection request
    updateCollectionRequest:function (collectionRequest) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(collectionRequest.id, function (req) {
            collectionRequest.name = req.name;
            collectionRequest.description = req.description;
            collectionRequest.collectionId = req.collectionId;
            collectionRequest.responses = req.responses;

            pmCollection.updateRequestInDataStore(collectionRequest, true, function(request) {
                pmCollection.trigger("updateCollectionRequest", request);
                pm.mediator.trigger("updateCollectionRequest", request);
            });
        });
    },

    updateCollectionRequestMeta: function(id, name, description) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(id, function (req) {
            req.name = name;
            req.description = description;

            pmCollection.updateRequestInDataStore(req, true, function(request) {
                pmCollection.trigger("updateCollectionRequest", request);
                pm.mediator.trigger("updateCollectionRequest", request);
            });
        });
    },

    updateCollectionRequestSyncStatus: function(id, status) {
        var pmCollection = this;

        pm.indexedDB.getCollectionRequest(id, function (req) {
            req.synced = status;

            pmCollection.updateRequestInDataStore(req, false, function(request) {
            });
        });
    },

    // Delete collection request
    deleteCollectionRequest:function (id, callback) {
        var pmCollection = this;

        pmCollection.deleteRequestFromDataStore(id, true, true, function() {
            pmCollection.trigger("removeCollectionRequest", id);

            if (callback) {
                callback();
            }
        });
    },

    moveRequestToFolder: function(requestId, targetFolderId) {
        var pmCollection = this;
        var request = _.clone(this.getRequestById(requestId));
        var folder = this.getFolderById(targetFolderId);
        var targetCollection = this.getCollectionForFolderId(targetFolderId);

        if(targetCollection.id === request.collectionId) {
            targetCollection.addRequestIdToFolder(folder.id, request.id);
            pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function() {
                pmCollection.trigger("moveRequestToFolder", targetCollection, folder, request);
            });
        }
        else {
            // Different collection
            pmCollection.deleteCollectionRequest(requestId, function() {
                request.id = guid();
                request.collectionId = targetCollection.get("id");

                targetCollection.addRequestIdToOrder(request.id);

                pmCollection.addRequestToDataStore(request, true, function(req) {
                    targetCollection.addRequestIdToFolder(folder.id, req.id);
                    var collection = targetCollection.getAsJSON();
                    pmCollection.updateCollectionInDataStore(collection, true, function(c) {
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

            pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function(c) {
                pmCollection.trigger("moveRequestToCollection", targetCollection, request);
            });
        }
        else {
            var oldCollection = pmCollection.get(request.collectionId);

            pmCollection.deleteCollectionRequest(requestId, function() {
                request.id = guid();
                request.collectionId = targetCollectionId;

                targetCollection.addRequestIdToOrder(request.id);

                pmCollection.addRequestToDataStore(request, true, function(req) {
                    pmCollection.updateCollectionInDataStore(targetCollection.getAsJSON(), true, function(c) {
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
        this.updateCollectionInDataStore(collection.getAsJSON(), true);
    },

    updateFolderOrder: function(collectionId, folderId, order) {
        var folder = this.getFolderById(folderId);
        folder.order = order;
        var collection = this.get(collectionId);
        collection.editFolder(folder);

        this.updateCollectionInDataStore(collection.getAsJSON(), true);
    },

    updateFolderMeta: function(id, name) {
        var folder = this.getFolderById(id);
        folder.name = name;
        var collection = this.getCollectionForFolderId(id);
        collection.editFolder(folder);
        this.trigger("updateFolder", collection, folder);

        this.updateCollectionInDataStore(collection.getAsJSON(), true);
    },

    deleteFolder: function(id) {
        var folder = this.getFolderById(id);
        var folderRequestsIds = _.clone(folder.order);
        var i;
        var collection;

        for(i = 0; i < folderRequestsIds.length; i++) {
            this.deleteRequestFromDataStore(folderRequestsIds[i], true, false);
        }

        collection = this.getCollectionForFolderId(id);
        collection.deleteFolder(id);

        this.trigger("deleteFolder", collection, id);
        this.updateCollectionInDataStore(collection.getAsJSON(), true);
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