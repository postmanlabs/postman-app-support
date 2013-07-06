var BasicAuthProcessor = Backbone.Model.extend({
    defaults: function() {
        return {
            "username": null,
            "password": null
        };
    },

    initialize: function() {
        this.on("change", this.updateDB, this);

        var model = this;

        pm.indexedDB.helpers.getHelper("basic", function(helper) {
            if (helper) {
                model.set(helper);
            }
        });
    },

    process: function () {
        var headers = pm.request.headers;
        var authHeaderKey = "Authorization";
        var pos = findPosition(headers, "key", authHeaderKey);

        var username = this.get("username");
        var password = this.get("password");

        username = pm.envManager.convertString(username);
        password = pm.envManager.convertString(password);

        var rawString = username + ":" + password;
        var encodedString = "Basic " + btoa(rawString);

        if (pos >= 0) {
            headers[pos] = {
                key: authHeaderKey,
                name: authHeaderKey,
                value: encodedString
            };
        }
        else {
            headers.push({key: authHeaderKey, name: authHeaderKey, value: encodedString});
        }

        pm.request.headers = headers;
        $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
        pm.request.openHeaderEditor();
    },

    updateDB: function() {
        var helper = {
            id: "basic",
            username: this.get("username"),
            password: this.get("password"),
            timestamp: new Date().getTime()
        };

        pm.indexedDB.helpers.addHelper(helper, function(helper) {
        });
    }
});

var DigestAuthProcessor = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "",
            "time": 0,
            "algorithm": "",
            "username": "",
            "realm": "",
            "password": "",
            "nonce": "",
            "nonceCount": "",
            "clientNonce": "",
            "opaque": "",
            "qop": ""
        };
    },

    initialize: function() {
        this.on("change", this.updateDB, this);

        var model = this;

        pm.indexedDB.helpers.getHelper("digest", function(helper) {
            if (helper) {
                model.set(helper);
            }
        });
    },

    getHeader: function () {
        var algorithm = pm.envManager.getCurrentValue(this.get("algorithm"));

        var username = pm.envManager.getCurrentValue(this.get("username"));
        var realm = pm.envManager.getCurrentValue(this.get("realm"));
        var password = pm.envManager.getCurrentValue(this.get("password"));
        var method = pm.request.method.toUpperCase();
        var nonce = pm.envManager.getCurrentValue(this.get("nonce"));
        var nonceCount = pm.envManager.getCurrentValue(this.get("nonceCount"));
        var clientNonce = pm.envManager.getCurrentValue(this.get("clientNonce"));

        var opaque = pm.envManager.getCurrentValue(this.get("opaque"));
        var qop = pm.envManager.getCurrentValue(this.get("qop"));
        var body = pm.request.getRequestBodyPreview();

        var url = pm.request.processUrl($('#url').val());
        var urlParts = pm.request.splitUrlIntoHostAndPath(url);
        var digestUri = urlParts.path;

        var a1;

        if(algorithm === "MD5-sess") {
            var a0 = CryptoJS.MD5(username + ":" + realm + ":" + password);
            a1 = a0 + ":" + nonce + ":" + clientNonce;
        }
        else {
            a1 = username + ":" + realm + ":" + password;
        }

        var a2;

        if(qop === "auth-int") {
            a2 = method + ":" + digestUri + ":" + body;
        }
        else {
            a2 = method + ":" + digestUri;
        }


        var ha1 = CryptoJS.MD5(a1);
        var ha2 = CryptoJS.MD5(a2);

        var response;

        if(qop === "auth-int" || qop === "auth") {
            response = CryptoJS.MD5(ha1 + ":"
                + nonce + ":"
                + nonceCount + ":"
                + clientNonce + ":"
                + qop + ":"
                + ha2);
        }
        else {
            response = CryptoJS.MD5(ha1 + ":" + nonce + ":" + ha2);
        }

        var headerVal = " ";
        headerVal += "username=\"" + username + "\", ";
        headerVal += "realm=\"" + realm + "\", ";
        headerVal += "nonce=\"" + nonce + "\", ";
        headerVal += "uri=\"" + digestUri + "\", ";

        if(qop === "auth" || qop === "auth-int") {
            headerVal += "qop=" + qop + ", ";
        }

        if(qop === "auth" || qop === "auth-int" || algorithm === "MD5-sess") {
            headerVal += "nc=" + nonceCount + ", ";
            headerVal += "cnonce=\"" + clientNonce + "\", ";
        }

        headerVal += "response=\"" + response + "\", ";
        headerVal += "opaque=\"" + opaque + "\"";

        return headerVal;
    },

    process: function () {
        var headers = pm.request.headers;
        var authHeaderKey = "Authorization";
        var pos = findPosition(headers, "key", authHeaderKey);

        //Generate digest header here

        var algorithm = $("#request-helper-digestAuth-realm").val();
        var headerVal;

        headerVal = this.getHeader();
        headerVal = "Digest" + headerVal;

        if (pos >= 0) {
            headers[pos] = {
                key: authHeaderKey,
                name: authHeaderKey,
                value: headerVal
            };
        }
        else {
            headers.push({key: authHeaderKey, name: authHeaderKey, value: headerVal});
        }

        pm.request.headers = headers;
        $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
        pm.request.openHeaderEditor();
    },

    updateDB: function() {
        var h = {
            id: "digest",
            time: new Date().getTime(),
            realm: this.get("realm"),
            username: this.get("username"),
            password: this.get("password"),
            nonce: this.get("nonce"),
            algorithm: this.get("algorithm"),
            nonceCount: this.get("nonceCount"),
            clientNonce: this.get("clientNonce"),
            opaque: this.get("opaque"),
            qop: this.get("qop")
        };

        pm.indexedDB.helpers.addHelper(h, function(h) {
        });
    }
});

var OAuth1Processor = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "oAuth1",
            "time": 0,
            "consumerKey": "",
            "consumerSecret": "",
            "token": "",
            "tokenSecret": "",
            "signatureMethod": "",
            "timestamp": "",
            "nonce": "",
            "version": "",
            "realm": "",
            "header": "",
            "auto": ""
        };
    },

    initialize: function() {
        var model = this;

        this.on("change", this.updateDB, this);

        pm.indexedDB.helpers.getHelper("oAuth1", function(helper) {
            if (helper) {
                model.set(helper);
                model.generateHelper()
            }
        });
    },

    updateDB: function() {
        var helper = {
            id: "oAuth1",
            time: new Date().getTime(),
            consumerKey: this.get("consumerKey"),
            consumerSecret: this.get("consumerSecret"),
            token: this.get("token"),
            tokenSecret: this.get("tokenSecret"),
            signatureMethod: this.get("signatureMethod"),
            timestamp: this.get("timestamp"),
            nonce: this.get("nonce"),
            version: this.get("version"),
            realm: this.get("realm"),
            header: this.get("header"),
            auto: this.get("auto")
        };

        pm.indexedDB.helpers.addHelper(helper, function(helper) {
        });
    },

    generateHelper: function () {
        this.set("timestamp", OAuth.timestamp());
        this.set("nonce", OAuth.nonce(6));
    },

    generateSignature: function () {
        //Make sure the URL is urlencoded properly
        //Set the URL keyval editor as well. Other get params disappear when you click on URL params again
        if ($('#url').val() === '') {
            $('#request-helpers').css("display", "block");
            alert('Please enter the URL first.');
            return null;
        }

        var processedUrl;

        var realm = $('#request-helper-oauth1-realm').val();

        if (realm === '') {
            processedUrl = pm.envManager.convertString($('#url').val()).trim();
        }
        else {
            processedUrl = pm.envManager.convertString(realm);
        }

        processedUrl = ensureProperUrl(processedUrl);

        if (processedUrl.indexOf('?') > 0) {
            processedUrl = processedUrl.split("?")[0];
        }

        var message = {
            action: processedUrl,
            method: pm.request.method,
            parameters: []
        };

        //all the fields defined by oauth
        $('input.signatureParam').each(function () {
            if ($(this).val() !=='') {
                var val = $(this).val();
                val = pm.envManager.convertString(val);
                message.parameters.push([$(this).attr('key'), val]);
            }
        });

        //Get parameters
        var urlParams = $('#url-keyvaleditor').keyvalueeditor('getValues');
        var bodyParams = [];

        if (pm.request.isMethodWithBody(pm.request.method)) {
            if (pm.request.body.mode === "params") {
                bodyParams = $('#formdata-keyvaleditor').keyvalueeditor('getValues');
            }
            else if (pm.request.body.mode === "urlencoded") {
                bodyParams = $('#urlencoded-keyvaleditor').keyvalueeditor('getValues');
            }
        }


        var params = urlParams.concat(bodyParams);

        for (var i = 0; i < params.length; i++) {
            var param = params[i];
            if (param.key) {
                param.value = pm.envManager.convertString(param.value);
                message.parameters.push([param.key, param.value]);
            }
        }

        var accessor = {};
        if ($('input[key="oauth_consumer_secret"]').val() !=='') {
            accessor.consumerSecret = $('input[key="oauth_consumer_secret"]').val();
            accessor.consumerSecret = pm.envManager.convertString(accessor.consumerSecret);
        }
        if ($('input[key="oauth_token_secret"]').val() !=='') {
            accessor.tokenSecret = $('input[key="oauth_token_secret"]').val();
            accessor.tokenSecret = pm.envManager.convertString(accessor.tokenSecret);
        }

        return OAuth.SignatureMethod.sign(message, accessor);
    },

    removeOAuthKeys: function (params) {
        var i, count;
        var oauthParams = [
            "oauth_consumer_key",
            "oauth_token",
            "oauth_signature_method",
            "oauth_timestamp",
            "oauth_nonce",
            "oauth_version",
            "oauth_signature"
        ];

        var newParams = [];
        var oauthIndexes = [];
        for (i = 0, count = params.length; i < count; i++) {
            var index = _.indexOf(oauthParams, params[i].key);
            if (index < 0) {
                newParams.push(params[i]);
            }
        }

        return newParams;
    },

    process: function () {
        var i, j, count, length;
        var params = [];
        var urlParams = pm.request.getUrlEditorParams();
        var bodyParams = [];

        if (pm.request.body.mode === "params") {
            bodyParams = $('#formdata-keyvaleditor').keyvalueeditor('getValues');
        }
        else if (pm.request.body.mode === "urlencoded") {
            bodyParams = $('#urlencoded-keyvaleditor').keyvalueeditor('getValues');
        }

        params = params.concat(urlParams);
        params = params.concat(bodyParams);

        params = this.removeOAuthKeys(params);

        var signatureKey = "oauth_signature";

        var oAuthParams = [];

        $('input.signatureParam').each(function () {
            if ($(this).val() !=='') {
                var val = $(this).val();
                oAuthParams.push({key: $(this).attr('key'), value: val});
            }
        });

        console.log("After adding oAuth params", params);

        //Convert environment values
        for (i = 0, length = params.length; i < length; i++) {
            params[i].value = pm.envManager.convertString(params[i].value);
        }

        for (j = 0, length = oAuthParams.length; i < length; i++) {
            oAuthParams[i].value = pm.envManager.convertString(oAuthParams[i].value);
        }

        var signature = this.generateSignature();

        if (signature === null) {
            return;
        }

        oAuthParams.push({key: signatureKey, value: signature});

        var addToHeader = $('#request-helper-oauth1-header').attr('checked') ? true : false;

        if (addToHeader) {
            var realm = $('#request-helper-oauth1-realm').val();

            if (realm === '') {
                realm = pm.envManager.convertString($('#url').val()).trim();
            }

            if (realm.indexOf('?') > 0) {
                realm = realm.split("?")[0];
            }

            console.log(realm);

            var headers = pm.request.headers;
            var authHeaderKey = "Authorization";

            var pos = findPosition(headers, "key", authHeaderKey);

            var rawString = "OAuth realm=\"" + realm + "\",";

            var len = oAuthParams.length;
            for (i = 0; i < len; i++) {
                rawString += encodeURIComponent(oAuthParams[i].key) + "=\"" + encodeURIComponent(oAuthParams[i].value) + "\",";
            }
            rawString = rawString.substring(0, rawString.length - 1);

            console.log(rawString);

            if (pos >= 0) {
                headers[pos] = {
                    key: authHeaderKey,
                    name: authHeaderKey,
                    value: rawString
                };
            }
            else {
                headers.push({key: authHeaderKey, name: authHeaderKey, value: rawString});
            }

            pm.request.headers = headers;
            $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
            pm.request.openHeaderEditor();
        } else {
            params = params.concat(oAuthParams);

            if (pm.request.method === "GET") {
                $('#url-keyvaleditor').keyvalueeditor('reset', params);
                pm.request.setUrlParamString(params);
                pm.request.openUrlEditor();
            } else {
                var dataMode = pm.request.body.getDataMode();
                if (dataMode === 'urlencoded') {
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', params);
                }
                else if (dataMode === 'params') {
                    $('#formdata-keyvaleditor').keyvalueeditor('reset', params);
                }
                else if (dataMode === 'raw') {
                    $('#url-keyvaleditor').keyvalueeditor('reset', params);
                    pm.request.setUrlParamString(params);
                    pm.request.openUrlEditor();
                }
            }
        }
    }
});

var BasicAuthForm = Backbone.View.extend({
    initialize: function() {
        this.model.on("change:username", this.render, this);
        this.model.on("change:password", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-basicAuth .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            var username = $('#request-helper-basicAuth-username').val();
            var password = $('#request-helper-basicAuth-password').val();

            model.set({"username": username, "password": password});
            model.process();
        });

        $('#request-helper-basicAuth .request-helper-clear').on("click", function () {
            view.clearFields();
        });
    },

    clearFields: function() {
        this.model.set({"username": "", "password": ""});
        $('#request-helper-basicAuth-username').val("");
        $('#request-helper-basicAuth-password').val("");
    },

    save: function() {
        var username = $('#request-helper-basicAuth-username').val();
        var password = $('#request-helper-basicAuth-password').val();
        this.model.set({"username": username, "password": password});
    },

    render: function() {
        $('#request-helper-basicAuth-username').val(this.model.get("username"));
        $('#request-helper-basicAuth-password').val(this.model.get("password"));
    }
});

var DigestAuthForm = Backbone.View.extend({
    initialize: function() {
        this.model.on("change", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-digestAuth .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            var helper = {
                id: "digest",
                time: new Date().getTime(),
                realm: $("#request-helper-digestAuth-realm").val(),
                username: $("#request-helper-digestAuth-username").val(),
                password: $("#request-helper-digestAuth-password").val(),
                nonce: $("#request-helper-digestAuth-nonce").val(),
                algorithm: $("#request-helper-digestAuth-algorithm").val(),
                nonceCount: $("#request-helper-digestAuth-nonceCount").val(),
                clientNonce: $("#request-helper-digestAuth-clientNonce").val(),
                opaque: $("#request-helper-digestAuth-opaque").val(),
                qop: $("#request-helper-digestAuth-qop").val()
            };

            model.set(helper);
            model.process();
        });

        $('#request-helper-digestAuth .request-helper-clear').on("click", function () {
            view.clearFields();
        });
    },

    clearFields: function () {
        $("#request-helper-digestAuth-realm").val("");
        $("#request-helper-digestAuth-username").val("");
        $("#request-helper-digestAuth-password").val("");
        $("#request-helper-digestAuth-nonce").val("");
        $("#request-helper-digestAuth-algorithm").val("");
        $("#request-helper-digestAuth-nonceCount").val("");
        $("#request-helper-digestAuth-clientNonce").val("");
        $("#request-helper-digestAuth-opaque").val("");
        $("#request-helper-digestAuth-qop").val("");

        //set values in the model
        var helper = {
            id: "digest",
            time: new Date().getTime(),
            realm: "",
            username: "",
            password: "",
            nonce: "",
            algorithm: "",
            nonceCount: "",
            clientNonce: "",
            opaque: "",
            qop: ""
        };

        this.model.set(helper);
    },

    save: function() {
        var helper = {
            id: "digest",
            time: new Date().getTime(),
            realm: $("#request-helper-digestAuth-realm").val(),
            username: $("#request-helper-digestAuth-username").val(),
            password: $("#request-helper-digestAuth-password").val(),
            nonce: $("#request-helper-digestAuth-nonce").val(),
            algorithm: $("#request-helper-digestAuth-algorithm").val(),
            nonceCount: $("#request-helper-digestAuth-nonceCount").val(),
            clientNonce: $("#request-helper-digestAuth-clientNonce").val(),
            opaque: $("#request-helper-digestAuth-opaque").val(),
            qop: $("#request-helper-digestAuth-qop").val()
        };

        //Replace this with the call to the model
        this.model.set(helper);
    },

    render: function() {
        $("#request-helper-digestAuth-realm").val(this.model.get("realm"));
        $("#request-helper-digestAuth-username").val(this.model.get("username"));
        $("#request-helper-digestAuth-algorithm").val(this.model.get("algorithm"));
        $("#request-helper-digestAuth-password").val(this.model.get("password"));
        $("#request-helper-digestAuth-nonce").val(this.model.get("nonce"));
        $("#request-helper-digestAuth-nonceCount").val(this.model.get("nonceCount"));
        $("#request-helper-digestAuth-clientNonce").val(this.model.get("clientNonce"));
        $("#request-helper-digestAuth-opaque").val(this.model.get("opaque"));
        $("#request-helper-digestAuth-qop").val(this.model.get("qop"));
    }
});

var OAuth1Form = Backbone.View.extend({
    initialize: function() {
        this.model.on("change", this.render, this);

        var view = this;
        var model = this.model;

        $('#request-helper-oAuth1 .request-helper-submit').on("click", function () {
            $('#request-helpers').css("display", "none");
            _.bind(view.save, view)();
            _.bind(model.process, model)();
        });

        $('#request-helper-oAuth1 .request-helper-clear').on("click", function () {
            view.clearFields();
        });

        $('#request-helper-oauth1-auto').click(function () {
            var isAutoEnabled = $('#request-helper-oauth1-auto').attr('checked') ? true : false;

            model.set("auto", isAutoEnabled);

            if (!isAutoEnabled) {
                $('#request-helper-oAuth1 .request-helper-submit').css("display", "inline-block");
            }
            else {
                $('#request-helper-oAuth1 .request-helper-submit').css("display", "none");
            }
        });
    },

    clearFields: function() {
        $("#request-helper-oauth1-consumerKey").val("");
        $("#request-helper-oauth1-consumerSecret").val("");
        $("#request-helper-oauth1-token").val("");
        $("#request-helper-oauth1-tokenSecret").val("");
        $("#request-helper-oauth1-signatureMethod").val("");
        $("#request-helper-oauth1-timestamp").val("");
        $("#request-helper-oauth1-nonce").val("");
        $("#request-helper-oauth1-version").val("");
        $("#request-helper-oauth1-realm").val("");
        $("#request-helper-oauth1-header").prop("checked", false);
        $("#request-helper-oauth1-auto").prop("checked", false);

        var helper = {
            id: "oAuth1",
            time: new Date().getTime(),
            consumerKey: "",
            consumerSecret: "",
            token: "",
            tokenSecret: "",
            signatureMethod: "",
            timestamp: "",
            nonce: "",
            version: "",
            realm: "",
            header: false,
            auto: false
        };

        this.model.set(helper);
    },

    save: function() {
        var helper = {
            id: "oAuth1",
            time: new Date().getTime(),
            consumerKey: $("#request-helper-oauth1-consumerKey").val(),
            consumerSecret: $("#request-helper-oauth1-consumerSecret").val(),
            token: $("#request-helper-oauth1-token").val(),
            tokenSecret: $("#request-helper-oauth1-tokenSecret").val(),
            signatureMethod: $("#request-helper-oauth1-signatureMethod").val(),
            timestamp: $("#request-helper-oauth1-timestamp").val(),
            nonce: $("#request-helper-oauth1-nonce").val(),
            version: $("#request-helper-oauth1-version").val(),
            realm: $("#request-helper-oauth1-realm").val(),
            header: $("#request-helper-oauth1-header").prop("checked"),
            auto: $("#request-helper-oauth1-auto").prop("checked")
        };

        this.model.set(helper);
    },

    render: function() {
        $("#request-helper-oauth1-consumerKey").val(this.model.get("consumerKey"));
        $("#request-helper-oauth1-consumerSecret").val(this.model.get("consumerSecret"));
        $("#request-helper-oauth1-token").val(this.model.get("token"));
        $("#request-helper-oauth1-tokenSecret").val(this.model.get("tokenSecret"));
        $("#request-helper-oauth1-signatureMethod").val(this.model.get("signatureMethod"));
        $("#request-helper-oauth1-timestamp").val(this.model.get("timestamp"));
        $("#request-helper-oauth1-nonce").val(this.model.get("nonce"));
        $("#request-helper-oauth1-version").val(this.model.get("version"));
        $("#request-helper-oauth1-realm").val(this.model.get("realm"));

        $("#request-helper-oauth1-header").prop("checked", this.model.get("header"));
        $("#request-helper-oauth1-auto").prop("checked", this.model.get("auto"));

        if (this.model.get("auto")) {
            $('#request-helper-oAuth1 .request-helper-submit').css("display", "none");
        }
        else {
            $('#request-helper-oAuth1 .request-helper-submit').css("display", "inline-block");
        }
    }
});

var Helpers = Backbone.Model.extend({
    defaults: function() {
        return {
            "activeHelper": "normal",
            "basicAuth": null,
            "digestAuth": null,
            "oAuth1": null
        };
    }
});

var HelperManager = Backbone.View.extend({
    initialize: function() {
        this.model.on("change:activeHelper", this.render, this);

        var view = this;

        $("#request-types .request-helper-tabs li").on("click", function () {
            $("#request-types .request-helper-tabs li").removeClass("active");
            $(event.currentTarget).addClass("active");
            var type = $(event.currentTarget).attr('data-id');
            view.showRequestHelper(type);
            view.render();
        });
    },

    showRequestHelper: function (type) {
        this.model.set("activeHelper", type);
        return false;
    },

    render: function() {
        var type = this.model.get("activeHelper");

        $("#request-types ul li").removeClass("active");
        $('#request-types ul li[data-id=' + type + ']').addClass('active');
        if (type !== "normal") {
            $('#request-helpers').css("display", "block");
        }
        else {
            $('#request-helpers').css("display", "none");
        }

        if (type.toLowerCase() === 'oauth1') {
            this.model.get("oAuth1").generateHelper();
        }

        $('.request-helpers').css("display", "none");
        $('#request-helper-' + type).css("display", "block");
    }
});