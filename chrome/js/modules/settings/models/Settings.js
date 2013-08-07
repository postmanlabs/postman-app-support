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

    resetSettings: function() {
        this.setSetting("historyCount", 100);
        this.setSetting("autoSaveRequest", true);
        this.setSetting("selectedEnvironmentId", true);
        this.setSetting("lineWrapping", true);
        this.setSetting("previewType", "parsed");
        this.setSetting("retainLinkHeaders", false);
        this.setSetting("sendNoCacheHeader", true);
        this.setSetting("sendPostmanTokenHeader", true);
        this.setSetting("usePostmanProxy", false);
        this.setSetting("proxyURL", "");
        this.setSetting("lastRequest", "");
        this.setSetting("launcherNotificationCount", 0);
        this.setSetting("variableDelimiter", "{{...}}");
        this.setSetting("languageDetection", "auto");
        this.setSetting("haveDonated", false);

        this.setSetting("requestBodyEditorContainerType", "editor");

        //Google Drive related
        this.setSetting("driveSyncConnectionStatus", "not_connected"); //notconnected, connected, disabled
        this.setSetting("driveSyncEnabled", false);
        this.setSetting("driveStartChangeId", 0);
        this.setSetting("driveAppDataFolderId", 0);
        this.setSetting("lastDriveChangeTime", "");
        this.setSetting("syncedGlobals", false);
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

            this.create("syncedGlobals", false);
            this.create("syncedHeaderPresets", false);

            if (pm.isTesting) {
                this.resetSettings();
            }

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