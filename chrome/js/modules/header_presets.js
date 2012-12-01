pm.headerPresets = {
    presets:[],
    presetsForAutoComplete:[],

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

        $(".header-presets-actions-submit").on("click", function () {
            var id = $('#header-presets-editor-id').val();
            if (id === "0") {
                pm.headerPresets.addHeaderPreset();
            }
            else {
                var name = $('#header-presets-editor-name').val();
                var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");
                pm.headerPresets.editHeaderPreset(id, name, headers);
            }

            pm.headerPresets.showList();
        });

        $("#header-presets-list").on("click", ".header-preset-action-edit", function () {
            var id = $(this).attr("data-id");
            var preset = pm.headerPresets.getHeaderPreset(id);
            $('#header-presets-editor-name').val(preset.name);
            $('#header-presets-editor-id').val(preset.id);
            $('#header-presets-keyvaleditor').keyvalueeditor('reset', preset.headers);
            pm.headerPresets.showEditor();
        });

        $("#header-presets-list").on("click", ".header-preset-action-delete", function () {
            var id = $(this).attr("data-id");
            pm.headerPresets.deleteHeaderPreset(id);
        });
    },

    loadPresets:function () {
        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            pm.headerPresets.presets = items;
            pm.headerPresets.refreshAutoCompleteList();
            $('#header-presets-list tbody').html("");
            $('#header-presets-list tbody').append(Handlebars.templates.header_preset_list({"items":items}));
        });
    },

    showManager:function () {
        $("#modal-header-presets").modal("show");
    },

    showList:function () {
        $("#header-presets-list-wrapper").css("display", "block");
        $("#header-presets-editor").css("display", "none");
        $("#header-presets-editor-name").attr("value", "");
        $("#header-presets-editor-id").attr("value", 0);
        $('#header-presets-keyvaleditor').keyvalueeditor('reset', []);
        $("#modal-header-presets .modal-footer").css("display", "none");
    },

    showEditor:function () {
        $("#modal-header-presets .modal-footer").css("display", "block");
        $("#header-presets-list-wrapper").css("display", "none");
        $("#header-presets-editor").css("display", "block");
    },

    getHeaderPreset:function (id) {
        for (var i = 0, count = pm.headerPresets.presets.length; i < count; i++) {
            if (pm.headerPresets.presets[i].id === id) break;
        }

        var preset = pm.headerPresets.presets[i];
        return preset;
    },

    addHeaderPreset:function () {
        var name = $("#header-presets-editor-name").val();
        var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");
        var id = guid();

        var headerPreset = {
            "id":id,
            "name":name,
            "headers":headers,
            "timestamp":new Date().getTime()
        };

        pm.indexedDB.headerPresets.addHeaderPreset(headerPreset, function () {
            pm.headerPresets.loadPresets();
        });
    },

    editHeaderPreset:function (id, name, headers) {
        pm.indexedDB.headerPresets.getHeaderPreset(id, function (preset) {
            var headerPreset = {
                "id":id,
                "name":name,
                "headers":headers,
                "timestamp":preset.timestamp
            };

            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, function () {
                pm.headerPresets.loadPresets();
            });
        });
    },

    deleteHeaderPreset:function (id) {
        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            pm.headerPresets.loadPresets();
        });
    },

    getPresetsForAutoComplete:function () {
        var list = [];
        for (var i = 0, count = pm.headerPresets.presets.length; i < count; i++) {
            var preset = pm.headerPresets.presets[i];
            var item = {
                "id":preset.id,
                "type":"preset",
                "label":preset.name,
                "category":"Header presets"
            };

            list.push(item);
        }

        return list;
    },

    refreshAutoCompleteList:function () {
        var presets = pm.headerPresets.getPresetsForAutoComplete();
        pm.headerPresets.presetsForAutoComplete = _.union(presets, chromeHeaders);
    }
};