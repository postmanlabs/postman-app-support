pm.headerPresets = {
    presets:[],

    init:function () {
        pm.headerPresets.loadPresets();

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $("#header-presets-keyvaleditor").keyvalueeditor("init", params);
        $("#headers-keyvaleditor-actions-manage-presets").on("click", function () {
            pm.headerPresets.showManager();
        });

        $(".header-presets-actions-add").on("click", function () {
            pm.headerPresets.showEditor();
        });
        
        $(".header-presets-actions-back").on("click", function () {
            pm.headerPresets.showList();
        });
        
        $(".header-presets-actions-submit").on("click", function() {
            pm.headerPresets.addHeaderPreset();
        });
    },

    loadPresets:function () {
        console.log("Trying to load presets");
        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            pm.headerPresets.presets = items;
            console.log(items);
            $('#header-presets-list').append(Handlebars.templates.header_preset_list({"items":items}));
        });
    },

    showManager:function () {
        $("#modal-header-presets").modal("show");
    },

    showList:function () {
        $("#header-presets-list-wrapper").css("display", "block");
        $("#header-presets-editor").css("display", "none");
    },

    showEditor:function () {
        $("#modal-header-presets .modal-footer").css("display", "block");
        $("#header-presets-list-wrapper").css("display", "none");
        $("#header-presets-editor").css("display", "block");
    },

    addHeaderPreset: function() {
        var name = $("#header-presets-editor-name").val();
        var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");
        var id = guid();

        var headerPreset = {
            "id": id,
            "name": name,
            "headers": headers,
            "timestamp":new Date().getTime()
        };

        pm.indexedDB.headerPresets.addHeaderPreset(headerPreset, function() {
            console.log("Added succesfully");
        });

    }
};