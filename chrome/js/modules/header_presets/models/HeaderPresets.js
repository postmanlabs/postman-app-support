var HeaderPresets = Backbone.Model.extend({
    defaults: function() {
        return {
            presets:[],
            presetsForAutoComplete:[]
        };
    },

    init:function () {
        this.on("change:presets", this.refreshAutoCompleteList, this);

        this.loadPresets();
        //TODO Disabling Drive for packaged apps
        //pm.headerPresets.drive.registerHandlers();
    },

    loadPresets:function () {
        var headerPresets = this;

        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            headerPresets.set({"presets": items});
            headerPresets.refreshAutoCompleteList();
        });
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

            //TODO: Drive Sync
            headerPresets.drive.queueHeaderPresetPost(headerPreset);
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

                //TODO: Drive Sync
                headerPresets.drive.queueHeaderPresetUpdate(headerPreset);
            });
        });
    },

    deleteHeaderPreset:function (id) {
        var headerPresets = this;

        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            _.bind(headerPresets.loadPresets, headerPresets)();
            //TODO: Drive Sync
            headerPresets.drive.queueHeaderPresetDelete(id);
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

        function onUpdateHeaderPreset() {
            headerPresets.loadPresets();
        }

        for(var i = 0; i < size; i++) {
            var headerPreset = hp[i];
            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, onUpdateHeaderPreset);
        }
    }
});