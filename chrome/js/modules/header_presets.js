var HeaderPresets = Backbone.Model.extend({
    defaults: function() {
        return {
            presets:[],
            presetsForAutoComplete:[]
        };
    },

    init:function () {
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
    },

    //TODO Refactor drive code later
    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) {
                    return;
                }

                pm.drive.onUpdate["postman_header_preset"] = pm.headerPresets.drive.updateHeaderPresetFromDrive;
                pm.drive.onPost["postman_header_preset"] = pm.headerPresets.drive.addHeaderPresetFromDrive;
                pm.drive.onDelete["header_preset"] = pm.headerPresets.drive.deleteHeaderPresetFromDrive;
            }
        },

        checkIfHeaderPresetIsOnDrive: function(id, callback) {
            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                if (driveFile) {
                    console.log("HeaderPreset found");
                    callback(true, driveFile);
                }
                else {
                    console.log("HeaderPreset not found");
                    callback(false);
                }

            });
        },

        queueHeaderPresetPost: function(headerPreset) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = headerPreset.id;
            var name = headerPreset.name + ".postman_header_preset";
            var filedata = JSON.stringify(headerPreset);

            pm.drive.queuePost(id, "header_preset", name, filedata, function() {
                console.log("Uploaded new headerPreset", name);
            });
        },

        queueHeaderPresetUpdate: function(headerPreset) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = headerPreset.id;
            var name = headerPreset.name + ".postman_header_preset";
            var filedata = JSON.stringify(headerPreset);

            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                pm.drive.queueUpdate(id, "header_preset", name, driveFile.file, filedata, function() {
                    console.log("Updated headerPreset", headerPreset.id);
                });
            });
        },

        queueHeaderPresetDelete: function(id) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            pm.headerPresets.drive.checkIfHeaderPresetIsOnDrive(id, function(exists, driveFile) {
                if (exists) {
                    pm.drive.queueDelete(id, "header_preset", driveFile.file, function() {
                        console.log("Deleted headerPreset", id);
                    });
                }
            });
        },

        updateHeaderPresetFromDrive: function(responseText) {
            console.log("Update headerPreset from drive", responseText);
            var headerPreset = JSON.parse(responseText);
            console.log(headerPreset, responseText);
            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, function () {
                pm.headerPresets.loadPresets();
            });
        },


        deleteHeaderPresetFromDrive: function(id) {
            console.log("Trying to delete headerPreset", id);
            pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
                pm.headerPresets.loadPresets();
            });

            pm.indexedDB.driveFiles.deleteDriveFile(id, function() {
            });
        },

        addHeaderPresetFromDrive: function(file, responseText) {
            var headerPreset = JSON.parse(responseText);
            console.log("Add to DB");
            pm.indexedDB.headerPresets.addHeaderPreset(headerPreset, function () {
                pm.headerPresets.loadPresets();
            });

            var newLocalDriveFile = {
                "id": headerPreset.id,
                "type": "header_preset",
                "timestamp":new Date().getTime(),
                "fileId": file.id,
                "file": file
            };

            pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {
                console.log("Uploaded file", newLocalDriveFile);
                var currentTime = new Date().toISOString();
                pm.settings.setSetting("lastDriveChangeTime", currentTime);
            });
        }
    }
});

var HeaderPresetsModal = Backbone.View.extend({
    el: $("#modal-header-presets"),

    initialize: function() {
        this.model.on('change:presets', this.render, this);

        var headerPresets = this.model;
        var view = this;

        $("#modal-header-presets").on("shown", function () {
            $(".header-presets-actions-add").focus();
            pm.layout.onModalOpen("#modal-header-presets");
        });

        $("#modal-header-presets").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $(".header-presets-actions-add").on("click", function () {
            view.showEditor();
        });

        $(".header-presets-actions-back").on("click", function () {
            view.showList();
        });

        $(".header-presets-actions-submit").on("click", function () {
            var id = $('#header-presets-editor-id').val();
            var name = $("#header-presets-editor-name").val();
            var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");

            if (id === "0") {
                _.bind(headerPresets.addHeaderPreset, headerPresets)(name, headers);
            }
            else {
                _.bind(headerPresets.editHeaderPreset, headerPresets)(id, name, headers);
            }

            view.showList();
        });

        $("#header-presets-list").on("click", ".header-preset-action-edit", function (event) {
            var id = $(event.currentTarget).attr("data-id");
            var preset = _.bind(headerPresets.getHeaderPreset, headerPresets)(id);
            $('#header-presets-editor-name').val(preset.name);
            $('#header-presets-editor-id').val(preset.id);
            $('#header-presets-keyvaleditor').keyvalueeditor('reset', preset.headers);
            view.showEditor();
        });

        $("#header-presets-list").on("click", ".header-preset-action-delete", function (event) {
            var id = $(event.currentTarget).attr("data-id");
            headerPresets.deleteHeaderPreset(id);
        });
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

    render: function() {
        $('#header-presets-list tbody').html("");
        $('#header-presets-list tbody').append(Handlebars.templates.header_preset_list({"items":this.model.get("presets")}));
    }
});

var HeaderPresetsRequestEditor = Backbone.View.extend({
    initialize: function() {
        this.model.on('change:presets', this.render, this);

        var model = this.model;

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $("#header-presets-keyvaleditor").keyvalueeditor("init", params);

        $("#headers-keyvaleditor-actions-manage-presets").on("click", function () {
            $("#modal-header-presets").modal("show");
        });

        $("#headers-keyvaleditor-actions-add-preset").on("click", ".header-preset-dropdown-item", function() {
            var id = $(this).attr("data-id");
            var preset = model.getHeaderPreset(id);

            if("headers" in preset) {
                var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');

                var newHeaders = _.union(headers, preset.headers);
                $('#headers-keyvaleditor').keyvalueeditor('reset', newHeaders);
            }
        });
    },

    render: function() {
        $('#headers-keyvaleditor-actions-add-preset ul').html("");
        $('#headers-keyvaleditor-actions-add-preset ul').append(Handlebars.templates.header_preset_dropdown({"items":this.model.get("presets")}));
    }
});