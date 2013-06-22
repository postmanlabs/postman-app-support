pm.settings = {
    historyCount:50,
    lastRequest:"",
    autoSaveRequest:true,
    selectedEnvironmentId:"",
    type: "chromeStorageArea",
    items: [],

    initValues: function(callback) {
        pm.settings.items = {};                    
        pm.storage.get("settings", function(settingsJson) {                           
            pm.settings.items = JSON.parse(settingsJson);

            pm.settings.create("historyCount", 100);
            pm.settings.create("autoSaveRequest", true);
            pm.settings.create("selectedEnvironmentId", true);
            pm.settings.create("lineWrapping", true);
            pm.settings.create("previewType", "parsed");
            pm.settings.create("retainLinkHeaders", false);
            pm.settings.create("sendNoCacheHeader", true);
            pm.settings.create("sendPostmanTokenHeader", true);
            pm.settings.create("usePostmanProxy", false);        
            pm.settings.create("proxyURL", "");
            pm.settings.create("lastRequest", "");
            pm.settings.create("launcherNotificationCount", 0);
            pm.settings.create("variableDelimiter", "{{...}}");
            pm.settings.create("languageDetection", "auto");
            pm.settings.create("haveDonated", false);

            pm.settings.create("requestBodyEditorContainerType", "editor");

            //Google Drive related
            pm.settings.create("driveSyncConnectionStatus", "not_connected"); //notconnected, connected, disabled        
            pm.settings.create("driveSyncEnabled", false);
            pm.settings.create("driveStartChangeId", 0);
            pm.settings.create("driveAppDataFolderId", 0);
            pm.settings.create("lastDriveChangeTime", "");

            $('#history-count').val(pm.settings.get("historyCount"));
            $('#auto-save-request').val(pm.settings.get("autoSaveRequest") + "");
            $('#retain-link-headers').val(pm.settings.get("retainLinkHeaders") + "");
            $('#send-no-cache-header').val(pm.settings.get("sendNoCacheHeader") + "");
            $('#send-postman-token-header').val(pm.settings.get("sendPostmanTokenHeader") + "");
            $('#use-postman-proxy').val(pm.settings.get("usePostmanProxy") + "");
            $('#postman-proxy-url').val(pm.settings.get("postmanProxyUrl"));
            $('#variable-delimiter').val(pm.settings.get("variableDelimiter"));
            $('#language-detection').val(pm.settings.get("languageDetection"));
            $('#have-donated').val(pm.settings.get("haveDonated") + "");

            pm.settings.initListeners();

            callback();
        });        
    },

    initListeners: function() {
        $('#history-count').change(function () {
            pm.settings.set("historyCount", $('#history-count').val());
        });

        $('#auto-save-request').change(function () {
            var val = $('#auto-save-request').val();
            if (val == "true") {
                pm.settings.set("autoSaveRequest", true);
            }
            else {
                pm.settings.set("autoSaveRequest", false);
            }
        });

        $('#retain-link-headers').change(function () {
            var val = $('#retain-link-headers').val();
            if (val === "true") {
                pm.settings.set("retainLinkHeaders", true);
            }
            else {
                pm.settings.set("retainLinkHeaders", false);
            }
        });        

        $('#send-no-cache-header').change(function () {
            var val = $('#send-no-cache-header').val();
            if (val == "true") {
                pm.settings.set("sendNoCacheHeader", true);
            }
            else {
                pm.settings.set("sendNoCacheHeader", false);
            }
        });

        $('#send-postman-token-header').change(function () {
            var val = $('#send-postman-token-header').val();
            if (val == "true") {
                pm.settings.set("sendPostmanTokenHeader", true);
            }
            else {
                pm.settings.set("sendPostmanTokenHeader", false);
            }
        });        

        $('#use-postman-proxy').change(function () {
            var val = $('#use-postman-proxy').val();
            if (val == "true") {
                pm.settings.set("usePostmanProxy", true);
                $('#postman-proxy-url-container').css("display", "block");
            }
            else {
                pm.settings.set("usePostmanProxy", false);
                $('#postman-proxy-url-container').css("display", "none");
            }
        });

        $('#postman-proxy-url').change(function () {
            pm.settings.set("postmanProxyUrl", $('#postman-proxy-url').val());
        });

        $('#variable-delimiter').change(function () {
            pm.settings.set("variableDelimiter", $('#variable-delimiter').val());
        });

        $('#language-detection').change(function () {
            pm.settings.set("languageDetection", $('#language-detection').val());
        });

        $('#have-donated').change(function () {
            var val = $('#have-donated').val();
            if (val == "true") {
                pm.layout.hideDonationBar();
                pm.settings.set("haveDonated", true);
            }
            else {
                pm.settings.set("haveDonated", false);
            }
        });

        $('#force-windows-line-endings').change(function () {
            var val = $('#force-windows-line-endings').val();
            if (val == "true") {
                pm.settings.set("forceWindowsLineEndings", true);
            }
            else {
                pm.settings.set("forceWindowsLineEndings", false);
            }
        });

        if (pm.settings.get("usePostmanProxy") == true) {
            $('#postman-proxy-url-container').css("display", "block");
        }
        else {
            $('#postman-proxy-url-container').css("display", "none");
        }
    },
    
    init:function (callback) {                
        pm.settings.initValues(callback);        
    },

    create:function (key, defaultVal) {
        if (!(key in pm.settings.items)) {            
            if (defaultVal !== "undefined") {
                pm.settings.set(key, defaultVal);
            }
        }
    },

    set:function (key, value) {
        pm.settings.items[key] = value;
        var o = {'settings': JSON.stringify(pm.settings.items)};
        pm.storage.set(o, function() {
        });
    },

    get:function (key) {
        var val = pm.settings.items[key];

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
        pm.settings.set("historyCount", settings.historyCount, false);
        pm.settings.set("autoSaveRequest", settings.autoSaveRequest, false);
        pm.settings.set("retainLinkHeaders", settings.retainLinkHeaders, false);
        pm.settings.set("sendNoCacheHeader", settings.sendNoCacheHeader, false);        
        pm.settings.set("variableDelimiter", settings.variableDelimiter, false);
        pm.settings.set("languageDetection", settings.languageDetection, false);
        pm.settings.set("haveDonated", settings.haveDonated, false);

        pm.settings.initValues();
        pm.settings.initListeners();
    },

    getAsJson: function() {
        var settings = {
            historyCount: pm.settings.get("historyCount"),
            autoSaveRequest: pm.settings.get("autoSaveRequest"),
            retainLinkHeaders: pm.settings.get("retainLinkHeaders"),
            sendNoCacheHeader: pm.settings.get("sendNoCacheHeader"),            
            variableDelimiter: pm.settings.get("variableDelimiter"),
            languageDetection: pm.settings.get("languageDetection"),
            haveDonated: pm.settings.get("haveDonated")
        };

        return settings;
    },

    drive: {
        registerHandlers: function() {
            if (pm.drive) {
                if (!pm.drive.isSyncEnabled()) return;

                pm.drive.onUpdate["postman_settings"] = pm.settings.drive.updateSettingsFromDrive;
                pm.drive.onPost["postman_settings"] = pm.settings.drive.addSettingsFromDrive;                
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
            if (!pm.drive.isSyncEnabled()) return;

            var id = "settings";
            var name = "settings" + ".postman_settings";
            var filedata = JSON.stringify(settings);
            
            pm.drive.queuePost(id, "settings", name, filedata, function() {                
            });            
        },

        queueSettingsUpdate: function(settings) {
            if (!pm.drive.isSyncEnabled()) return;

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
            pm.settings.update(settings);
        },

        addSettingsFromDrive: function(file, responseText) {
            var settings = JSON.parse(responseText);            
            pm.settings.update(settings);

            var newLocalDriveFile = {
                "id": "settings",
                "type": "settings",
                "timestamp":new Date().getTime(),
                "fileId": file.id,
                "file": file
            };

            pm.indexedDB.driveFiles.addDriveFile(newLocalDriveFile, function(e) {                                        
                var currentTime = new Date().toISOString();
                pm.settings.set("lastDriveChangeTime", currentTime);                
            });  
        }
    }
};