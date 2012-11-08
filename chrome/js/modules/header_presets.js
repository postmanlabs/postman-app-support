pm.headerPresets = {
    presets: [],

    init: function() {
        pm.headerPresets.loadPresets();
        $('#header-presets-keyvaleditor').keyvalueeditor('init');
        $('#headers-keyvaleditor-actions-manage-presets').on("click", function() {
            pm.headerPresets.showManager();
        });
    },

    loadPresets: function() {
        pm.indexedDB.headerPresets.getAllHeaderPresets(function(items) {
            pm.headerPresets.presets = items;
        });
    },

    showManager: function() {
        $('#modal-header-presets').modal("show");
    }
};