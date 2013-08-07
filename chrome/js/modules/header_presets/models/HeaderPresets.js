var HeaderPresets = Backbone.Model.extend({
    isLoaded: false,
    initializedSyncing: false,    

    defaults: function() {
        return {
            "initialized": false,
            "syncFileID": "postman_header_presets",
            "syncFileType": "header_presets",
            "presets":[],
            "presetsForAutoComplete":[]
        };
    },

    init:function () {
        this.on("change:presets", this.refreshAutoCompleteList, this);

        this.loadPresets();
    },

    loadPresets:function () {        
        this.startListeningForFileSystemSyncEvents();

        var headerPresets = this;

        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            headerPresets.set({"presets": items});
            headerPresets.refreshAutoCompleteList();

            if (!headerPresets.get("initialized")) {
                headerPresets.set("initialized", true);
                headerPresets.isLoaded = true;
                headerPresets.trigger("startSync");    
            }
            else {
                headerPresets.addToSyncableFilesystem(headerPresets.get("syncFileID"));
            }
            
        });
    },

    startListeningForFileSystemSyncEvents: function() {
        var model = this;
        var isLoaded = model.isLoaded;
        var initializedSyncing = model.initializedSyncing;

        pm.mediator.on("initializedSyncableFileSystem", function() {
            model.initializedSyncing = true;
            model.trigger("startSync");
        });

        this.on("startSync", this.startSyncing, this);
    },

    startSyncing: function() {        
        var i = 0;
        var model = this;
        var presets;
        var synced;
        var syncableFile;

        if (this.isLoaded && this.initializedSyncing) {
            pm.mediator.on("addSyncableFileFromRemote", function(type, data) {
                if (type === "header_presets") {
                    model.onReceivingSyncableFileData(data);    
                }            
            });

            pm.mediator.on("updateSyncableFileFromRemote", function(type, data) {
                if (type === "header_presets") {
                    model.onReceivingSyncableFileData(data);    
                }
            });
            
            pm.mediator.on("deleteSyncableFileFromRemote", function(type, id) {
                if (type === "header_presets") {
                    model.onRemoveSyncableFile(id);    
                }            
            });            

            synced = pm.settings.getSetting("syncedHeaderPresets");

            if (!synced) {                
                this.addToSyncableFilesystem(this.get("syncFileID"));
            }
        }
        else {
            console.log("Either presets not loaded or not initialized syncing");
        }
    },

    onReceivingSyncableFileData: function(data) {
        var presets = JSON.parse(data);
        this.mergeHeaderPresets(presets);
    },

    onRemoveSyncableFile: function(id) {
        console.log("Do nothing");
    },

    getAsSyncableFile: function(id) {        
        var name = id + ".header_presets";
        var type = "header_presets";
        var data = JSON.stringify(this.get("presets"));

        return {
            "name": name,
            "type": type,
            "data": data
        };
    },

    addToSyncableFilesystem: function(id) {
        var model = this;

        var syncableFile = this.getAsSyncableFile(id);

        pm.mediator.trigger("addSyncableFile", syncableFile, function(result) {            
            if(result === "success") {
                model.updateHeaderPresetSyncStatus(id, true);
            }
        });
    },

    removeFromSyncableFilesystem: function(id) {
        var name = id + ".header_presets";
        pm.mediator.trigger("removeSyncableFile", name, function(result) {            
        });
    },

    updateHeaderPresetSyncStatus: function(id, status) {
        pm.settings.setSetting("syncedHeaderPresets", status);
    },

    getHeaderPreset:function (id) {
        var presets = this.get("presets");
        for (var i = 0, count = presets.length; i < count; i++) {
            if (presets[i].id === id) {
                break;
            }
        }

        var preset = presets[i];
        return preset;
    },

    addHeaderPreset:function (name, headers) {
        var id = guid();

        var headerPreset = {
            "id":id,
            "name":name,
            "headers":headers,
            "timestamp":new Date().getTime()
        };

        var headerPresets = this;

        pm.indexedDB.headerPresets.addHeaderPreset(headerPreset, function () {
            _.bind(headerPresets.loadPresets, headerPresets)();            
        });
    },

    editHeaderPreset:function (id, name, headers) {
        var headerPresets = this;

        pm.indexedDB.headerPresets.getHeaderPreset(id, function (preset) {
            var headerPreset = {
                "id":id,
                "name":name,
                "headers":headers,
                "timestamp":preset.timestamp
            };

            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, function () {
                _.bind(headerPresets.loadPresets, headerPresets)();
            });
        });
    },

    deleteHeaderPreset:function (id) {
        var headerPresets = this;

        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            _.bind(headerPresets.loadPresets, headerPresets)();
        });
    },

    getPresetsForAutoComplete:function () {
        var list = [];
        var presets = this.get("presets");

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

        list = _.union(list, chromeHeaders);

        return list;
    },

    refreshAutoCompleteList:function () {
        var presets = this.getPresetsForAutoComplete();
        this.set({"presetsForAutoComplete": _.union(presets, chromeHeaders)});
    },

    mergeHeaderPresets: function(hp) {
        var size = hp.length;
        var headerPresets = this;

        headerPresets.set({"presets": hp});

        function onUpdateHeaderPreset() {
            console.log("Updated header preset");
        }

        for(var i = 0; i < size; i++) {
            var headerPreset = hp[i];
            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, onUpdateHeaderPreset);
        }
    }
});