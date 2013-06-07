//Added dependency on drive.js. Will need a wrapper around 
//both drive.js and indexed_db.js
pm.indexedDB = {
    TABLE_HEADER_PRESETS: "header_presets",
    TABLE_HELPERS: "helpers",
    TABLE_DRIVE_FILES: "drive_files",
    TABLE_DRIVE_CHANGES: "drive_changes",

    onTransactionComplete: function() {        
        console.log("onTransactionComplete");
        pm.history.getAllRequests();
        pm.envManager.getAllEnvironments();
        pm.headerPresets.init();
        pm.helpers.loadFromDB();

        var activeSidebarSection = pm.settings.get("activeSidebarSection");

        if (activeSidebarSection) {
            pm.layout.sidebar.select(activeSidebarSection);    
        }        
        else {
            pm.layout.sidebar.select("history");
        }
    },    

    onerror:function (event, callback) {
        console.log("error");
        console.log(event);
    },

    open_v21:function () {

        var request = indexedDB.open("postman", "POSTman request history");
        request.onsuccess = function (e) {
            var v = "0.7.4";
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
                        var requestStore = db.createObjectStore("header_presets", {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_HELPERS)) {
                        var requestStore = db.createObjectStore(pm.indexedDB.TABLE_HELPERS, {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_FILES)) {
                        var requestStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_FILES, {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false}); 
                        requestStore.createIndex("fileId", "fileId", { unique:false});                                               
                    }
                    else {
                        var requestStore = request.transaction.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);
                        requestStore.createIndex("fileId", "fileId", { unique:false});                        
                    }

                    if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_CHANGES)) {
                        var requestStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_CHANGES, {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false});                        
                    }

                    var transaction = event.target.result;
                    transaction.oncomplete = pm.indexedDB.onTransactionComplete;
                };

                setVrequest.onupgradeneeded = function (evt) {
                };
            }
            else {
                pm.history.getAllRequests();
                pm.envManager.getAllEnvironments();
                pm.headerPresets.init();
            }

        };

        request.onfailure = pm.indexedDB.onerror;
    },

    open_latest:function () {
        var v = 20;
        var request = indexedDB.open("postman", v);                        
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
                var requestStore = db.createObjectStore("header_presets", {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_HELPERS)) {
                var requestStore = db.createObjectStore(pm.indexedDB.TABLE_HELPERS, {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_FILES)) {
                console.log("Drive files does not exist");
                var requestStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_FILES, {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});       
                requestStore.createIndex("fileId", "fileId", { unique:false});                                 
            }
            else {
                console.log("Trying to create a new index");
                var requestStore = request.transaction.objectStore(pm.indexedDB.TABLE_DRIVE_FILES);
                requestStore.createIndex("fileId", "fileId", { unique:false});                        
            }

            if (!db.objectStoreNames.contains(pm.indexedDB.TABLE_DRIVE_CHANGES)) {
                var requestStore = db.createObjectStore(pm.indexedDB.TABLE_DRIVE_CHANGES, {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});
            }
        };

        request.onsuccess = function (e) {
            pm.indexedDB.db = e.target.result;
            pm.indexedDB.onTransactionComplete();
        };

        request.onerror = pm.indexedDB.onerror;
    },

    open:function () {
        if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) < 23) {
            pm.indexedDB.open_v21();
        }
        else {            
            pm.indexedDB.open_latest();
        }
    },

    addCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        var request;

        if("order" in collection) {
            request = store.put({
                "id":collection.id,
                "name":collection.name,
                "order":collection.order,
                "timestamp":new Date().getTime()
            });
        }
        else {
            request = store.put({
                "id":collection.id,
                "name":collection.name,
                "timestamp":new Date().getTime()
            });
        }
        

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
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        var version;

        if ("version" in req) {
            version = req.version;
        }
        else {
            version = 1;
        }
        
        var collectionRequest = store.put({
            "collectionId":req.collectionId,
            "id":req.id,
            "name":req.name,
            "description":req.description,
            "url":req.url.toString(),
            "method":req.method.toString(),
            "headers":req.headers.toString(),
            "data":req.data,
            "dataMode":req.dataMode.toString(),
            "timestamp":req.timestamp,
            "responses":req.responses,
            "version":req.version
        });

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

        if (db == null) {
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
        if (db == null) {
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
            pm.collections.deleteCollectionRequest(request.id);
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
            pm.indexedDB.deleteAllCollectionRequests(id);
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
            if (db == null) {
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
            if (db == null) {
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
            if (db == null) {
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
            if (db == null) {
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
                    console.log(driveChanges);
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


    downloadAllData: function(callback) {

    },

    importAllData: function(callback) {
        
    }
};