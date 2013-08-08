var HeaderPreset = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "name": "",
            "headers": [],
            "timestamp": 0,
            "synced": false            
        };
    }
});

var HeaderPresets = Backbone.Collection.extend({
    model: HeaderPreset,

    isLoaded: false,
    initializedSyncing: false,

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

    defaults: function() {
        return {
            presets:[],
            
        };
    },

    presetsForAutoComplete:[],

    init:function () {
        this.on("change", this.refreshAutoCompleteList, this);
        this.loadPresets();
    },

    // Initialize all models
    loadPresets:function () {
        var collection = this;

        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            collection.add(items, {merge: true});            
            collection.refreshAutoCompleteList();
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
    addHeaderPreset:function (name, headers) {
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
        });
    },

    // Update local model
    editHeaderPreset:function (id, name, headers) {
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
            });
        });
    },

    // Remove from local model
    deleteHeaderPreset:function (id) {
        var collection = this;

        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            collection.remove(id);
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

        list = _.union(list, chromeHeaders);

        return list;
    },

    refreshAutoCompleteList:function () {
        var presets = this.getPresetsForAutoComplete();
        this.presetsForAutoComplete = presets;        
    },

    // TODO Used in data import. Use editHeaderPreset()
    mergeHeaderPresets: function(hp) {
        var size = hp.length;
        var collection = this;

        function onUpdateHeaderPreset(preset) {
            collection.add(preset, {merge: true});
        }

        for(var i = 0; i < size; i++) {
            var headerPreset = hp[i];
            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, onUpdateHeaderPreset);
        }
    }
});