pm.indexedDB = {
    TABLE_HEADER_PRESETS: "header_presets",
    TABLE_HELPERS: "helpers",
    TABLE_DRIVE_FILES: "drive_files",
    TABLE_DRIVE_CHANGES: "drive_changes",
    TABLE_OAUTH2_ACCESS_TOKENS: "oauth2_access_tokens",

    onTransactionComplete: function(callback) {
        if (pm.isTesting) {
            pm.indexedDB.clearAllObjectStores(function() {
                callback();
            });
        }
        else {
            callback();
        }
    },

    onerror:function (event, callback) {
        console.log("Could not load DB", event);
        pm.mediator.trigger("error");
    },

    open_v21:function (callback) {

        var request = indexedDB.open(pm.databaseName, "POSTman request history");
        request.onsuccess = function (e) {
            var v = "0.7.6";
            pm.indexedDB.db = e.target.result;
            var db = pm.indexedDB.db;

            //We can only create Object stores in a setVersion transaction
            if (v !== db.version) {
                var setVrequest = db.setVersion(v);

                setVrequest.onfailure = function (e) {
                    console.log(e);
                };

                setVrequest.onsuccess = function (event) {
                    //Only create if does not already exist
                    if (!db.objectStoreNames.contains("requests")) {
                        var requestStore = db.createObjectStore("requests", {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains("collections")) {
                        var collectionsStore = db.createObjectStore("collections", {keyPath:"id"});
                        collectionsStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains("collection_requests")) {
                        var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath:"id"});
                        collectionRequestsStore.createIndex("timestamp", "timestamp", { unique:false});
                        collectionRequestsStore.createIndex("collectionId", "collectionId", { unique:false});
                    }

                    if (db.objectStoreNames.contains("collection_responses")) {
                        db.deleteObjectStore("collection_responses");
                    }

                    if (!db.objectStoreNames.contains("environments")) {
                        var environmentsStore = db.createObjectStore("environments", {keyPath:"id"});
                        environmentsStore.createIndex("timestamp", "timestamp", { unique:false});
                        environmentsStore.createIndex("id", "id", { unique:false});
                    }

                    if (!db.objectStoreNames.contains("header_presets")) {
                        var headerPresetsStore = db.createObjectStore("header_presets", {keyPath:"id"});
                        headerPresetsStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_HELPERS)) {
                        var helpersStore = db.createObjectStore(pm.indexedDB.TABLE_HELPERS, {keyPath:"id"});
                        helpersStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_FILES)) {
                        var driveFilesStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_FILES, {keyPath:"id"});
                        driveFilesStore.createIndex("timestamp", "timestamp", { unique:false});
                        driveFilesStore.createIndex("fileId", "fileId", { unique:false});
                    }
                    else {
                        var driveFilesStoreForIndex = request.transaction.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);
                        driveFilesStoreForIndex.createIndex("fileId", "fileId", { unique:false});
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_CHANGES)) {
                        var driveChangesStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_CHANGES, {keyPath:"id"});
                        driveChangesStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS)) {
                        var accessTokenStore = db.createObjectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS, {keyPath:"id"});
                        accessTokenStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    var transaction = event.target.result;
                    transaction.oncomplete = pm.indexedDB.onTransactionComplete;
                };

                setVrequest.onupgradeneeded = function (evt) {
                };
            }
        };

        request.onfailure = pm.indexedDB.onerror;
    },

    open_latest:function (callback) {
        var v = 22;
        var request = indexedDB.open(pm.databaseName, v);
        request.onupgradeneeded = function (e) {
            console.log("Upgrade DB");
            var db = e.target.result;
            pm.indexedDB.db = db;

            if (!db.objectStoreNames.contains("requests")) {
                var requestStore = db.createObjectStore("requests", {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains("collections")) {
                var collectionsStore = db.createObjectStore("collections", {keyPath:"id"});
                collectionsStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains("collection_requests")) {
                var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath:"id"});
                collectionRequestsStore.createIndex("timestamp", "timestamp", { unique:false});
                collectionRequestsStore.createIndex("collectionId", "collectionId", { unique:false});
            }

            if (db.objectStoreNames.contains("collection_responses")) {
                db.deleteObjectStore("collection_responses");
            }

            if (!db.objectStoreNames.contains("environments")) {
                var environmentsStore = db.createObjectStore("environments", {keyPath:"id"});
                environmentsStore.createIndex("timestamp", "timestamp", { unique:false});
                environmentsStore.createIndex("id", "id", { unique:false});
            }

            if (!db.objectStoreNames.contains("header_presets")) {
                var headerPresetsStore = db.createObjectStore("header_presets", {keyPath:"id"});
                headerPresetsStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_HELPERS)) {
                var helpersStore = db.createObjectStore(pm.indexedDB.TABLE_HELPERS, {keyPath:"id"});
                helpersStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_FILES)) {
                var driveFilesStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_FILES, {keyPath:"id"});
                driveFilesStore.createIndex("timestamp", "timestamp", { unique:false});
                driveFilesStore.createIndex("fileId", "fileId", { unique:false});
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_CHANGES)) {
                var driveChangesStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_CHANGES, {keyPath:"id"});
                driveChangesStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS)) {
                var accessTokenStore = db.createObjectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS, {keyPath:"id"});
                accessTokenStore.createIndex("timestamp", "timestamp", { unique:false});
            }
        };

        request.onsuccess = function (e) {
            pm.indexedDB.db = e.target.result;
            pm.indexedDB.onTransactionComplete(callback);
        };

        request.onerror = pm.indexedDB.onerror;
    },

    open:function (callback) {
        if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) < 23) {
            pm.indexedDB.open_v21(callback);
        }
        else {
            pm.indexedDB.open_latest(callback);
        }

        pm.mediator.on("initiateBackup", pm.indexedDB.downloadAllData);
    },

    clearAllObjectStores: function(callback) {
        console.log("Clearing all object stores");
        //Make sure we are testing and the database is not postman
        if (pm.isTesting && pm.databaseName !== "postman") {
            var stores = [
                "requests", "collections", "header_presets",
                "collection_requests", "environments",
                pm.indexedDB.TABLE_HELPERS,
                pm.indexedDB.TABLE_DRIVE_FILES,
                pm.indexedDB.TABLE_DRIVE_CHANGES
            ];

            var db = pm.indexedDB.db;
            var transaction = db.transaction(stores, "readwrite");
            transaction.objectStore("requests").clear();
            transaction.objectStore("collections").clear();
            transaction.objectStore("collection_requests").clear();
            transaction.objectStore("environments").clear();
            transaction.objectStore("header_presets").clear();
            transaction.objectStore(pm.indexedDB.TABLE_HELPERS).clear();
            transaction.objectStore(pm.indexedDB.TABLE_DRIVE_FILES).clear();
            transaction.objectStore(pm.indexedDB.TABLE_DRIVE_CHANGES).clear();

            transaction.oncomplete = function(event) {
                console.log("Cleared the database");
                if (callback) {
                    callback();
                }
            };
        }
    },

    addCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        var request;

        request = store.put(collection);

        request.onsuccess = function () {
            callback(collection);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    updateCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        var boundKeyRange = IDBKeyRange.only(collection.id);
        var request = store.put(collection);

        request.onsuccess = function (e) {
            callback(collection);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    addCollectionRequest:function (req, callback) {
        console.log("Saving the request", req);

        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        var collectionRequest = store.put(req);

        collectionRequest.onsuccess = function () {
            callback(req);
        };

        collectionRequest.onerror = function (e) {
            console.log(e.value);
        };
    },

    updateCollectionRequest:function (req, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        var boundKeyRange = IDBKeyRange.only(req.id);
        var request = store.put(req);

        request.onsuccess = function (e) {
            callback(req);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    getCollection:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            callback(result);
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    getCollections:function (callback) {
        var db = pm.indexedDB.db;

        if (db === null) {
            return;
        }

        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = store.openCursor(keyRange);
        var numCollections = 0;
        var items = [];
        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                callback(items);
                return;
            }

            var collection = result.value;
            numCollections++;

            items.push(collection);

            result['continue']();
        };

        cursorRequest.onerror = function (e) {
            console.log(e);
        };
    },

    getAllCollectionRequests:function (callback) {
        var db = pm.indexedDB.db;
        if (db === null) {
            return;
        }

        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var index = store.index("timestamp");
        var cursorRequest = index.openCursor(keyRange);
        var collectionRequests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                if (callback) {
                    callback(collectionRequests);
                }
                else {
                    console.log(collectionRequests);
                }

                return;
            }

            var request = result.value;
            collectionRequests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };

        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    getAllRequestsForCollectionId:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        var requests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(requests);
                return;
            }

            var request = result.value;
            requests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    getAllRequestsInCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");

        //Get everything in the store
        var keyRange = IDBKeyRange.only(collection.id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        var requests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(collection, requests);
                return;
            }

            var request = result.value;
            requests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    addRequest:function (historyRequest, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["requests"], "readwrite");
        var store = trans.objectStore("requests");
        var request = store.put(historyRequest);

        request.onsuccess = function (e) {
            callback(historyRequest);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    getRequest:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["requests"], "readwrite");
        var store = trans.objectStore("requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            callback(result);
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    getCollectionRequest:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            callback(result);
            return result;
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },


    getAllRequestItems:function (callback) {
        var db = pm.indexedDB.db;
        if (db === null) {
            return;
        }

        var trans = db.transaction(["requests"], "readwrite");
        var store = trans.objectStore("requests");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var index = store.index("timestamp");
        var cursorRequest = index.openCursor(keyRange);
        var historyRequests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(historyRequests);
                return;
            }

            var request = result.value;
            historyRequests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };

        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    deleteRequest:function (id, callback) {
        try {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["requests"], "readwrite");
            var store = trans.objectStore(["requests"]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        }
        catch (e) {
            console.log(e);
        }
    },

    deleteHistory:function (callback) {
        var db = pm.indexedDB.db;
        var clearTransaction = db.transaction(["requests"], "readwrite");
        var clearRequest = clearTransaction.objectStore(["requests"]).clear();
        clearRequest.onsuccess = function (event) {
            callback();
        };
    },

    deleteCollectionRequest:function (id, callback) {
        pm.indexedDB.getCollectionRequest(id, function(collectionRequest) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["collection_requests"], "readwrite");
            var store = trans.objectStore(["collection_requests"]);

            var request = store['delete'](id);

            request.onsuccess = function (e) {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        });
    },

    deleteAllCollectionRequests:function (id) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                return;
            }

            var request = result.value;
            pm.indexedDB.deleteCollectionRequest(request.id, function() {
                console.log("Deleted from DB");
            });
            result['continue']();
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    deleteCollection:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore(["collections"]);

        var request = store['delete'](id);

        request.onsuccess = function () {
            // pm.indexedDB.deleteAllCollectionRequests(id);
            callback(id);
        };

        request.onerror = function (e) {
            console.log(e);
        };
    },

    environments:{
        addEnvironment:function (environment, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");
            var request = store.put(environment);

            request.onsuccess = function (e) {
                callback(environment);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getEnvironment:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };
            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        deleteEnvironment:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore(["environments"]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getAllEnvironments:function (callback) {
            var db = pm.indexedDB.db;
            if (db === null) {
                return;
            }

            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var environments = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    callback(environments);
                    return;
                }

                var request = result.value;
                environments.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateEnvironment:function (environment, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");

            var boundKeyRange = IDBKeyRange.only(environment.id);
            var request = store.put(environment);

            request.onsuccess = function (e) {
                callback(environment);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        }
    },

    helpers:{
        addHelper:function (helper, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HELPERS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HELPERS);
            var request = store.put(helper);

            request.onsuccess = function (e) {
                callback(helper);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getHelper:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HELPERS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HELPERS);

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        }
    },

    headerPresets:{
        addHeaderPreset:function (headerPreset, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);
            var request = store.put(headerPreset);

            request.onsuccess = function (e) {
                callback(headerPreset);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getHeaderPreset:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };
            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        deleteHeaderPreset:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore([pm.indexedDB.TABLE_HEADER_PRESETS]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getAllHeaderPresets:function (callback) {
            var db = pm.indexedDB.db;
            if (db === null) {
                console.log("Db is null");
                return;
            }

            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var headerPresets = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    callback(headerPresets);
                    return;
                }

                var request = result.value;
                headerPresets.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateHeaderPreset:function (headerPreset, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);

            var boundKeyRange = IDBKeyRange.only(headerPreset.id);
            var request = store.put(headerPreset);

            request.onsuccess = function (e) {
                callback(headerPreset);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        }
    },

    driveFiles: {
        addDriveFile:function (driveFile, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_FILES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);
            var request = store.put(driveFile);

            request.onsuccess = function (e) {
                console.log("Added file");
                callback(driveFile);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getDriveFile:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_FILES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        getDriveFileByFileId:function (fileId, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_FILES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);

            //Get everything in the store
            var keyRange = IDBKeyRange.only(fileId);
            var index = store.index("fileId");
            var cursorRequest = index.openCursor(keyRange);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                console.log(result);
                if(result) {
                    callback(result.value);
                }
                else {
                    callback(null);
                }

            };

            cursorRequest.onerror = function(e) {
                callback(null);
            };
        },

        deleteDriveFile:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_FILES], "readwrite");
            var store = trans.objectStore([pm.indexedDB.TABLE_DRIVE_FILES]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getAllDriveFiles:function (callback) {
            var db = pm.indexedDB.db;
            if (db === null) {
                console.log("Db is null");
                return;
            }

            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_FILES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var driveFiles = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    callback(driveFiles);
                    return;
                }

                var request = result.value;
                driveFiles.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateDriveFile:function (driveFile, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_FILES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);

            var boundKeyRange = IDBKeyRange.only(driveFile.id);
            var request = store.put(driveFile);

            request.onsuccess = function (e) {
                callback(driveFile);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        }
    },


    driveChanges: {
        addDriveChange:function (driveChange, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_CHANGES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_CHANGES);
            var request = store.put(driveChange);

            request.onsuccess = function (e) {
                callback(driveChange);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getDriveChange:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_CHANGES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_CHANGES);

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };
            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        deleteDriveChange:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_CHANGES], "readwrite");
            var store = trans.objectStore([pm.indexedDB.TABLE_DRIVE_CHANGES]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getAllDriveChanges:function (callback) {
            var db = pm.indexedDB.db;
            if (db === null) {
                console.log("Db is null");
                return;
            }

            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_CHANGES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_CHANGES);

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var driveChanges = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    driveChanges.sort(sortAscending);
                    callback(driveChanges);
                    return;
                }

                var request = result.value;
                driveChanges.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateDriveChange:function (driveChange, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_DRIVE_CHANGES], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_DRIVE_CHANGES);

            var boundKeyRange = IDBKeyRange.only(driveChange.id);
            var request = store.put(driveChange);

            request.onsuccess = function (e) {
                callback(driveChange);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        }
    },

    oAuth2AccessTokens: {
        addAccessToken: function(token, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS);
            var request = store.put(token);

            request.onsuccess = function (e) {
                callback(token);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        deleteAccessToken: function(id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS);

            //Get everything in the store
            var request = store['delete'](id);

            request.onsuccess = function (e) {
                callback(id);
            };
            request.onerror = pm.indexedDB.onerror;
        },

        getAllAccessTokens: function(callback) {
            var db = pm.indexedDB.db;
            if (db === null) {
                console.log("Db is null");
                return;
            }

            var trans = db.transaction([pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS);

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var accessTokens = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    callback(accessTokens);
                    return;
                }

                var request = result.value;
                accessTokens.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateAccessToken:function (accessToken, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS);

            var boundKeyRange = IDBKeyRange.only(accessToken.id);
            var request = store.put(accessToken);

            request.onsuccess = function (e) {
                callback(accessToken);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        },

        getAccessToken: function(id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_OAUTH2_ACCESS_TOKENS);

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };
            cursorRequest.onerror = pm.indexedDB.onerror;
        }
    },

    // TODO Refactor this. Needs to reduce dependencies
    downloadAllData: function(callback) {
        console.log("Starting to download all data");

        //Get globals
        var totalCount = 0;
        var currentCount = 0;
        var collections = [];
        var globals = [];
        var environments = [];
        var headerPresets = [];

        var onFinishGettingCollectionRequests = function(collection) {
            collections.push(collection);

            currentCount++;

            if (currentCount === totalCount) {
                onFinishExportingCollections(collections);
            }
        }

        var onFinishExportingCollections = function(c) {
            console.log(pm.envManager);

            globals = pm.envManager.get("globals").get("globals");

            //Get environments
            pm.indexedDB.environments.getAllEnvironments(function (e) {
                environments = e;
                pm.indexedDB.headerPresets.getAllHeaderPresets(function (hp) {
                    headerPresets = hp;
                    onFinishExporttingAllData(callback);
                });
            });
        }

        var onFinishExporttingAllData = function() {
            console.log("collections", collections);
            console.log("environments", environments);
            console.log("headerPresets", headerPresets);
            console.log("globals", globals);

            var dump = {
                version: 1,
                collections: collections,
                environments: environments,
                headerPresets: headerPresets,
                globals: globals
            };

            var name = "Backup.postman_dump";
            var filedata = JSON.stringify(dump);
            var type = "application/json";
            pm.filesystem.saveAndOpenFile(name, filedata, type, function () {
                if (callback) {
                    callback();
                }
            });
        }

        //Get collections
        //Get header presets
        pm.indexedDB.getCollections(function (items) {
            totalCount = items.length;
            pm.collections.items = items;
            var itemsLength = items.length;

            function onGetAllRequestsInCollection(collection, requests) {
                collection.requests = requests;
                onFinishGettingCollectionRequests(collection);
            }

            if (itemsLength !== 0) {
                for (var i = 0; i < itemsLength; i++) {
                    var collection = items[i];
                    pm.indexedDB.getAllRequestsInCollection(collection, onGetAllRequestsInCollection);
                }
            }
            else {
                globals = pm.envManager.get("globals").get("globals");

                pm.indexedDB.environments.getAllEnvironments(function (e) {
                    environments = e;
                    pm.indexedDB.headerPresets.getAllHeaderPresets(function (hp) {
                        headerPresets = hp;
                        onFinishExporttingAllData(callback);
                    });
                });
            }
        });
    },

    importAllData: function(files, callback) {
        if (files.length !== 1) {
            return;
        }

        var f = files[0];
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                // Render thumbnail.
                var data = e.currentTarget.result;
                var j = JSON.parse(data);
                var version = j.version;
                pm.indexedDB.importDataForVersion(version, j, callback);
            };
        })(files[0]);

        // Read in the image file as a data URL.
        reader.readAsText(files[0]);
    },

    importDataForVersion: function(version, data, callback) {
        if (version === 1) {
            var environments = pm.envManager.get("environments");
            var globals = pm.envManager.get("globals");

            if ("collections" in data) {
                console.log("Import collections");
                pm.collections.mergeCollections(data.collections);
            }

            if ("environments" in data) {
                console.log("Import environments");
                environments.mergeEnvironments(data.environments);
            }

            if ("globals" in data) {
                console.log("Import globals");
                globals.mergeGlobals(data.globals);
            }

            if ("headerPresets" in data) {
                console.log("Import headerPresets");
                pm.headerPresets.mergeHeaderPresets(data.headerPresets);
            }
        }

        callback();
    }
};