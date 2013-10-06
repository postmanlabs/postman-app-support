var HeaderPreset = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "headers": [],
            "timestamp": 0,
            "synced": false
        };
    },

    toSyncableJSON: function() {
        var j = this.toJSON();
        j.synced = true;
        return j;
    }
});

var HeaderPresets = Backbone.Collection.extend({
    model: HeaderPreset,

    isLoaded: false,
    initializedSyncing: false,
    syncFileType: "header_preset",

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

    presetsForAutoComplete:[],

    initialize:function () {
        this.on("change", this.refreshAutoCompleteList, this);
        this.loadPresets();
    },

    // Initialize all models
    loadPresets:function () {
        var collection = this;

        this.startListeningForFileSystemSyncEvents();

        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            collection.add(items, {merge: true});
            collection.refreshAutoCompleteList();

            collection.isLoaded = true;
            collection.trigger("startSync");
        });
    },

    startListeningForFileSystemSyncEvents: function() {
        var collection = this;
        var isLoaded = collection.isLoaded;
        var initializedSyncing = collection.initializedSyncing;

        pm.mediator.on("initializedSyncableFileSystem", function() {
            collection.initializedSyncing = true;
            collection.trigger("startSync");
        });

        this.on("startSync", this.startSyncing, this);
    },

    startSyncing: function() {
        var i = 0;
        var collection = this;
        var headerPreset;
        var synced;
        var syncableFile;

        if (this.isLoaded && this.initializedSyncing) {
            pm.mediator.on("addSyncableFileFromRemote", function(type, data) {
                if (type === collection.syncFileType) {
                    collection.onReceivingSyncableFileData(data);
                }
            });

            pm.mediator.on("updateSyncableFileFromRemote", function(type, data) {
                if (type === collection.syncFileType) {
                    collection.onReceivingSyncableFileData(data);
                }
            });

            pm.mediator.on("deleteSyncableFileFromRemote", function(type, id) {
                if (type === collection.syncFileType) {
                    collection.onRemoveSyncableFile(id);
                }
            });

            // And this
            for(i = 0; i < this.models.length; i++) {
                headerPreset = this.models[i];
                synced = headerPreset.get("synced");

                if (!synced) {
                    this.addToSyncableFilesystem(headerPreset.get("id"));
                }
            }
        }
        else {
        }
    },

    onReceivingSyncableFileData: function(data) {
        this.mergeHeaderPreset(JSON.parse(data), true);
    },

    onRemoveSyncableFile: function(id) {
        this.deleteHeaderPreset(id, true);
    },

    getAsSyncableFile: function(id) {
        var collection = this;
        var headerPreset = this.get(id);
        var name = id + "." + collection.syncFileType;
        var type = collection.syncFileType;
        var data = JSON.stringify(headerPreset.toSyncableJSON());

        return {
            "name": name,
            "type": type,
            "data": data
        };
    },

    addToSyncableFilesystem: function(id) {
        var collection = this;

        var syncableFile = this.getAsSyncableFile(id);
        pm.mediator.trigger("addSyncableFile", syncableFile, function(result) {
            if(result === "success") {
                collection.updateHeaderPresetSyncStatus(id, true);
            }
        });
    },

    removeFromSyncableFilesystem: function(id) {
        var collection = this;

        var name = id + "." + collection.syncFileType;
        pm.mediator.trigger("removeSyncableFile", name, function(result) {
        });
    },

    // Iterate through models
    getHeaderPreset:function (id) {
        var presets = this.models;
        var preset;
        for (var i = 0, count = presets.length; i < count; i++) {
            preset = presets[i];
            if (preset.get("id") === id) {
                break;
            }
        }

        return preset;
    },

    // Add to models
    addHeaderPreset:function (name, headers, doNotSync) {
        var id = guid();

        var headerPreset = {
            "id":id,
            "name":name,
            "headers":headers,
            "timestamp":new Date().getTime()
        };

        var collection = this;

        pm.indexedDB.headerPresets.addHeaderPreset(headerPreset, function () {
            collection.add(headerPreset, {merge: true});

            if (!doNotSync) {
                collection.addToSyncableFilesystem(id);
            }
        });
    },

    // Update local model
    editHeaderPreset:function (id, name, headers, doNotSync) {
        var collection = this;

        pm.indexedDB.headerPresets.getHeaderPreset(id, function (preset) {
            var headerPreset = {
                "id":id,
                "name":name,
                "headers":headers,
                "timestamp":preset.timestamp
            };

            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, function () {
                collection.add(headerPreset, {merge: true});

                if (!doNotSync) {
                    collection.addToSyncableFilesystem(id);
                }
            });
        });
    },

    updateHeaderPresetSyncStatus: function(id, status) {
        var collection = this;

        var headerPreset = this.get(id);
        headerPreset.set("synced", status);
        collection.add(headerPreset, {merge: true});

        pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset.toJSON(), function () {
        });
    },

    // Remove from local model
    deleteHeaderPreset:function (id, doNotSync) {
        var collection = this;

        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            collection.remove(id);

            if (!doNotSync) {
                collection.removeFromSyncableFilesystem(id);
            }
        });
    },

    getPresetsForAutoComplete:function () {
        var list = [];
        var presets = this.toJSON();

        for (var i = 0, count = presets.length; i < count; i++) {
            var preset = presets[i];
            var item = {
                "id":preset.id,
                "type":"preset",
                "label":preset.name,
                "category":"Header presets"
            };

            list.push(item);
        }

        list = _.union(list, allowedChromeHeaders);
        list = _.union(list, restrictedChromeHeaders);

        return list;
    },

    refreshAutoCompleteList:function () {
        var presets = this.getPresetsForAutoComplete();
        this.presetsForAutoComplete = presets;
    },

    mergeHeaderPreset: function(preset, doNotSync) {
        var collection = this;

        pm.indexedDB.headerPresets.addHeaderPreset(preset, function(headerPreset) {
            collection.add(headerPreset, {merge: true});

            if (!doNotSync) {
                collection.addToSyncableFilesystem(headerPreset.id);
            }
        });

    },

    mergeHeaderPresets: function(hp) {
        var size = hp.length;
        var collection = this;
        var headerPreset;

        for(var i = 0; i < size; i++) {
            headerPreset = hp[i];
            collection.mergeHeaderPreset(headerPreset);
        }
    }
});