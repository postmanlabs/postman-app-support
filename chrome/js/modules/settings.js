var Settings = Backbone.Model.extend({
    defaults: function() {
        return {
            lastRequest:"",
            autoSaveRequest:true,
            selectedEnvironmentId:"",
            type: "chromeStorageArea",
            items: {}
        };
    },

    initValues: function(callback) {
        this.set({"items": {}});

        var func = function(settingsJson) {
            if (settingsJson !== null) {
                this.set({"items": JSON.parse(settingsJson)});
            }

            this.create("historyCount", 100);
            this.create("autoSaveRequest", true);
            this.create("selectedEnvironmentId", true);
            this.create("lineWrapping", true);
            this.create("previewType", "parsed");
            this.create("retainLinkHeaders", false);
            this.create("sendNoCacheHeader", true);
            this.create("sendPostmanTokenHeader", true);
            this.create("usePostmanProxy", false);
            this.create("proxyURL", "");
            this.create("lastRequest", "");
            this.create("launcherNotificationCount", 0);
            this.create("variableDelimiter", "{{...}}");
            this.create("languageDetection", "auto");
            this.create("haveDonated", false);

            this.create("requestBodyEditorContainerType", "editor");

            //Google Drive related
            this.create("driveSyncConnectionStatus", "not_connected"); //notconnected, connected, disabled
            this.create("driveSyncEnabled", false);
            this.create("driveStartChangeId", 0);
            this.create("driveAppDataFolderId", 0);
            this.create("lastDriveChangeTime", "");

            callback();
        };

        func = _.bind(func, this);
        pm.storage.getValue("settings", func);
    },

    //This moves to the view initialize script?
    initListeners: function() {
    },

    test: function() {
        console.log("Testing the function");
    },

    init:function (callback) {
        this.initValues(callback);
    },

    create:function (key, defaultVal) {
        if (!(key in this.get("items"))) {
            if (defaultVal !== "undefined") {
                this.setSetting(key, defaultVal);
            }
        }
    },

    setSetting:function (key, value) {
        //Need to clone otherwise Backbone will not fire the correct event
        var newItems = _.clone(this.get("items"));
        newItems[key] = value;
        this.set({items: newItems});

        var o = {'settings': JSON.stringify(this.get("items"))};
        pm.storage.setValue(o, function() {
        });
    },

    getSetting:function (key) {
        var val = this.get("items")[key];

        if (val === "true") {
            return true;
        }
        else if (val === "false") {
            return false;
        }
        else {
            return val;
        }
    },

    update: function(settings) {
        this.setSetting("historyCount", settings.historyCount, false);
        this.setSetting("autoSaveRequest", settings.autoSaveRequest, false);
        this.setSetting("retainLinkHeaders", settings.retainLinkHeaders, false);
        this.setSetting("sendNoCacheHeader", settings.sendNoCacheHeader, false);
        this.setSetting("variableDelimiter", settings.variableDelimiter, false);
        this.setSetting("languageDetection", settings.languageDetection, false);
        this.setSetting("haveDonated", settings.haveDonated, false);

        this.initValues();
        this.initListeners();
    },

    getAsJson: function() {
        var settings = {
            historyCount: this.getSetting("historyCount"),
            autoSaveRequest: this.getSetting("autoSaveRequest"),
            retainLinkHeaders: this.getSetting("retainLinkHeaders"),
            sendNoCacheHeader: this.getSetting("sendNoCacheHeader"),
            variableDelimiter: this.getSetting("variableDelimiter"),
            languageDetection: this.getSetting("languageDetection"),
            haveDonated: this.getSetting("haveDonated")
        };

        return settings;
    },

    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) {
                    return;
                }

                pm.drive.onUpdate["postman_settings"] = this.drive.updateSettingsFromDrive;
                pm.drive.onPost["postman_settings"] = this.drive.addSettingsFromDrive;
            }
        },

        checkIfSettingsIsOnDrive: function(id, callback) {
            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                if (driveFile) {
                    callback(true, driveFile);
                }
                else {
                    callback(false);
                }

            });
        },

        queueSettingsPost: function(settings) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = "settings";
            var name = "settings" + ".postman_settings";
            var filedata = JSON.stringify(settings);

            pm.drive.queuePost(id, "settings", name, filedata, function() {
            });
        },

        queueSettingsUpdate: function(settings) {
            if (!pm.drive.isSyncEnabled()) {
                return;
            }

            var id = "settings";
            var name = "settings" + ".postman_settings";
            var filedata = JSON.stringify(settings);

            pm.indexedDB.driveFiles.getDriveFile(id, function(driveFile) {
                pm.drive.queueUpdate(id, "settings", name, driveFile.file, filedata, function() {
                });
            });
        },

        updateSettingsFromDrive: function(responseText) {
            var settings = JSON.parse(responseText);
            this.update(settings);
        },

        addSettingsFromDrive: function(file, responseText) {
            var settings = JSON.parse(responseText);
            this.update(settings);

            var newLocalDriveFile = {
                "id": "settings",
                "type": "settings",
                "timestamp":new Date().getTime(),
                "fileId": file.id,
                "file": file
            };

            pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {
                var currentTime = new Date().toISOString();
                this.setSetting("lastDriveChangeTime", currentTime);
            });
        }
    }
});

var SettingsModal = Backbone.View.extend({
    el: $("#modal-settings"),

    initialize: function() {
        console.log(this, this.model);
        var settings = this.model;
        this.model.on('change:items', this.render, this);

        $('#history-count').change(function () {
            settings.setSetting("historyCount", $('#history-count').val());
        });

        $('#auto-save-request').change(function () {
            var val = $('#auto-save-request').val();
            if (val === "true") {
                settings.setSetting("autoSaveRequest", true);
            }
            else {
                settings.setSetting("autoSaveRequest", false);
            }
        });

        $('#retain-link-headers').change(function () {
            var val = $('#retain-link-headers').val();
            if (val === "true") {
                settings.setSetting("retainLinkHeaders", true);
            }
            else {
                settings.setSetting("retainLinkHeaders", false);
            }
        });

        $('#send-no-cache-header').change(function () {
            var val = $('#send-no-cache-header').val();
            if (val === "true") {
                settings.setSetting("sendNoCacheHeader", true);
            }
            else {
                settings.setSetting("sendNoCacheHeader", false);
            }
        });

        $('#send-postman-token-header').change(function () {
            var val = $('#send-postman-token-header').val();
            if (val === "true") {
                settings.setSetting("sendPostmanTokenHeader", true);
            }
            else {
                settings.setSetting("sendPostmanTokenHeader", false);
            }
        });

        $('#use-postman-proxy').change(function () {
            var val = $('#use-postman-proxy').val();
            if (val === "true") {
                settings.setSetting("usePostmanProxy", true);
                $('#postman-proxy-url-container').css("display", "block");
            }
            else {
                settings.setSetting("usePostmanProxy", false);
                $('#postman-proxy-url-container').css("display", "none");
            }
        });

        $('#postman-proxy-url').change(function () {
            settings.setSetting("postmanProxyUrl", $('#postman-proxy-url').val());
        });

        $('#variable-delimiter').change(function () {
            settings.setSetting("variableDelimiter", $('#variable-delimiter').val());
        });

        $('#language-detection').change(function () {
            settings.setSetting("languageDetection", $('#language-detection').val());
        });

        $('#have-donated').change(function () {
            var val = $('#have-donated').val();
            if (val === "true") {
                pm.layout.hideDonationBar();
                settings.setSetting("haveDonated", true);
            }
            else {
                settings.setSetting("haveDonated", false);
            }
        });

        $('#force-windows-line-endings').change(function () {
            var val = $('#force-windows-line-endings').val();
            if (val === "true") {
                settings.setSetting("forceWindowsLineEndings", true);
            }
            else {
                settings.setSetting("forceWindowsLineEndings", false);
            }
        });

        $("#download-all-data").on("click", function() {
            pm.indexedDB.downloadAllData(function() {
                noty(
                {
                    type:'success',
                    text:'Saved the data dump',
                    layout:'topRight',
                    timeout:750
                });
            });
        });

        $("#import-all-data-files-input").on("change", function(event) {
            console.log("Process file and import data");
            var files = event.target.files;
            pm.indexedDB.importAllData(files, function() {
                $("#import-all-data-files-input").val("");
                noty(
                {
                    type:'success',
                    text:'Imported the data dump',
                    layout:'topRight',
                    timeout:750
                });
            });
        });

        $("#clear-local-cache").on("click", function(event) {
            console.log("Clear local cache files");
            //Write code to clear RAL files
            RAL.FileSystem.removeDir('cache', function() {
                console.log("All clear");
            });
        });

        if (this.model.getSetting("usePostmanProxy") === true) {
            $('#postman-proxy-url-container').css("display", "block");
        }
        else {
            $('#postman-proxy-url-container').css("display", "none");
        }

        this.render();
    },

    render: function() {
        console.log("Render called");

        $('#history-count').val(this.model.getSetting("historyCount"));
        $('#auto-save-request').val(this.model.getSetting("autoSaveRequest") + "");
        $('#retain-link-headers').val(this.model.getSetting("retainLinkHeaders") + "");
        $('#send-no-cache-header').val(this.model.getSetting("sendNoCacheHeader") + "");
        $('#send-postman-token-header').val(this.model.getSetting("sendPostmanTokenHeader") + "");
        $('#use-postman-proxy').val(this.model.getSetting("usePostmanProxy") + "");
        $('#postman-proxy-url').val(this.model.getSetting("postmanProxyUrl"));
        $('#variable-delimiter').val(this.model.getSetting("variableDelimiter"));
        $('#language-detection').val(this.model.getSetting("languageDetection"));
        $('#have-donated').val(this.model.getSetting("haveDonated") + "");
    }
});
