pm.headerPresets = {
    presets:[],
    presetsForAutoComplete:[],

    init:function () {
        pm.headerPresets.loadPresets();
        pm.headerPresets.drive.registerHandlers();

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

        $("#headers-keyvaleditor-actions-add-preset").on("click", ".header-preset-dropdown-item", function() {
            var id = $(this).attr("data-id");
            var preset = pm.headerPresets.getHeaderPreset(id);

            if("headers" in preset) {                    
                var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');                                                           
                
                var newHeaders = _.union(headers, preset.headers);                
                $('#headers-keyvaleditor').keyvalueeditor('reset', newHeaders);                
            }
        });
    },

    loadPresets:function () {
        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            pm.headerPresets.presets = items;
            pm.headerPresets.refreshAutoCompleteList();
            $('#header-presets-list tbody').html("");
            $('#header-presets-list tbody').append(Handlebars.templates.header_preset_list({"items":items}));

            //TODO Add to the Add preset dropdown
            $('#headers-keyvaleditor-actions-add-preset ul').html("");
            $('#headers-keyvaleditor-actions-add-preset ul').append(Handlebars.templates.header_preset_dropdown({"items":items}));            
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

            //TODO: Drive Sync
            pm.headerPresets.drive.queueHeaderPresetPost(headerPreset);
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

                //TODO: Drive Sync
                pm.headerPresets.drive.queueHeaderPresetUpdate(headerPreset);
            });
        });
    },

    deleteHeaderPreset:function (id) {
        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            pm.headerPresets.loadPresets();

            //TODO: Drive Sync
            pm.headerPresets.drive.queueHeaderPresetDelete(id);
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
    },

    mergeHeaderPresets: function(headerPresets) {
        var size = headerPresets.length;
        for(var i = 0; i < size; i++) {
            var headerPreset = headerPresets[i];
            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, function () {
                pm.headerPresets.loadPresets();
            });    
        }        
    },

    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) return;

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
            if (!pm.drive.isSyncEnabled()) return;

            var id = headerPreset.id;
            var name = headerPreset.name + ".postman_header_preset";
            var filedata = JSON.stringify(headerPreset);
            
            pm.drive.queuePost(id, "header_preset", name, filedata, function() {
                console.log("Uploaded new headerPreset", name);                
            });            
        },

        queueHeaderPresetUpdate: function(headerPreset) {
            if (!pm.drive.isSyncEnabled()) return;

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
            if (!pm.drive.isSyncEnabled()) return;

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
};