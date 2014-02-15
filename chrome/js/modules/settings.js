pm.settings = {
    historyCount:50,
    lastRequest:"",
    autoSaveRequest:true,
    selectedEnvironmentId:"",

    createSettings: function() {
        pm.settings.create("historyCount", 100);
        pm.settings.create("autoSaveRequest", true);
        pm.settings.create("selectedEnvironmentId", true);
        pm.settings.create("lineWrapping", true);
        pm.settings.create("disableIframePreview", false);
        pm.settings.create("previewType", "parsed");
        pm.settings.create("retainLinkHeaders", false);
        pm.settings.create("sendNoCacheHeader", true);
        pm.settings.create("usePostmanProxy", false);
        pm.settings.create("proxyURL", "");
        pm.settings.create("lastRequest", "");
        pm.settings.create("launcherNotificationCount", 0);
        pm.settings.create("variableDelimiter", "{{...}}");
        pm.settings.create("languageDetection", "auto");
        pm.settings.create("haveDonated", false);
    },

    initValues: function() {
        $('#history-count').val(pm.settings.get("historyCount"));
        $('#auto-save-request').val(pm.settings.get("autoSaveRequest") + "");
        $('#retain-link-headers').val(pm.settings.get("retainLinkHeaders") + "");
        $('#send-no-cache-header').val(pm.settings.get("sendNoCacheHeader") + "");
        $('#use-postman-proxy').val(pm.settings.get("usePostmanProxy") + "");
        $('#postman-proxy-url').val(pm.settings.get("postmanProxyUrl"));
        $('#variable-delimiter').val(pm.settings.get("variableDelimiter"));
        $('#language-detection').val(pm.settings.get("languageDetection"));
        $('#have-donated').val(pm.settings.get("haveDonated") + "");
        $('#disable-iframe-preview').val(pm.settings.get("disableIframePreview") + "");
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

        $('#disable-iframe-preview').change(function () {
            var val = $('#disable-iframe-preview').val();
            if (val == "true") {
                pm.settings.set("disableIframePreview", true);
            }
            else {
                pm.settings.set("disableIframePreview", false);
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

        if (pm.settings.get("usePostmanProxy") == true) {
            $('#postman-proxy-url-container').css("display", "block");
        }
        else {
            $('#postman-proxy-url-container').css("display", "none");
        }
    },

    init:function () {
        pm.settings.createSettings();
        pm.settings.initValues();
        pm.settings.initListeners();
    },

    create:function (key, defaultVal) {
        if (localStorage[key]) {
            pm.settings[key] = localStorage[key];
        }
        else {
            if (defaultVal !== "undefined") {
                pm.settings[key] = defaultVal;
                localStorage[key] = defaultVal;
            }
        }
    },

    set:function (key, value) {
        pm.settings[key] = value;
        localStorage[key] = value;
    },

    get:function (key) {
        var val = localStorage[key];
        if (val === "true") {
            return true;
        }
        else if (val === "false") {
            return false;
        }
        else {
            return localStorage[key];
        }
    }
};