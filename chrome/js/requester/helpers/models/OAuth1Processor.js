var OAuth1Processor = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "oAuth1",
            "time": 0,
            "consumerKey": "",
            "consumerSecret": "",
            "token": "",
            "tokenSecret": "",
            "signatureMethod": "HMAC-SHA1",
            "timestamp": "",
            "nonce": "",
            "version": "",
            "realm": "",
            "header": "",
            "auto": "",
            "request": null
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
        if(this.get("version") === "") {
            this.set("version", "1.0");
        }

        if(this.get("signatureMethod" === "")) {
            this.set("signatureMethod", "HMAC-SHA1");
        }

        this.set("timestamp", OAuth.timestamp() + "");
        this.set("nonce", OAuth.nonce(6));
    },

    generateSignature: function () {
        //Make sure the URL is urlencoded properly
        //Set the URL keyval editor as well. Other get params disappear when you click on URL params again
        var request = this.get("request");
        var i;
        var url = request.get("url");
        if (url === '') {
            noty(
                {
                    type:'success',
                    text:'Please enter a URL first',
                    layout:'topCenter',
                    timeout:750
                });

            return null;
        }

        var processedUrl;

        var realm = this.get("realm");
        var method = request.get("method");
        var requestBody = request.get("body");

        processedUrl = pm.envManager.getCurrentValue(url).trim();
        processedUrl = ensureProperUrl(processedUrl);

        if (processedUrl.indexOf('?') > 0) {
            processedUrl = processedUrl.split("?")[0];
        }

        var message = {
            action: processedUrl,
            method: method,
            parameters: []
        };

        var signatureParams = [
            {key: "oauth_consumer_key", value: this.get("consumerKey")},
            {key: "oauth_token", value: this.get("token")},
            {key: "oauth_signature_method", value: this.get("signatureMethod")},
            {key: "oauth_timestamp", value: this.get("timestamp")},
            {key: "oauth_nonce", value: this.get("nonce")},
            {key: "oauth_version", value: this.get("version")}
        ];

        for(i = 0; i < signatureParams.length; i++) {
            var param = signatureParams[i];
            param.value = pm.envManager.getCurrentValue(param.value);
            message.parameters.push([param.key, param.value]);
        }

        //Get parameters
        var urlParams = request.getUrlParams();

        var bodyParams;

        if (pm.methods.isMethodWithBody(method)) {
            bodyParams = requestBody.get("dataAsObjects");
        }
        else {
            bodyParams = [];
        }

        var params = _.union(urlParams, bodyParams);
        var param;
        var existingOAuthParams = _.union(signatureParams, [{key: "oauth_signature", value: ""}]);
        var pos;

        for (i = 0; i < params.length; i++) {
            param = params[i];
            if (param.key) {
                pos = findPosition(existingOAuthParams, "key", param.key);
                if (pos < 0) {
                    param.value = pm.envManager.getCurrentValue(param.value);
                    message.parameters.push([param.key, param.value]);
                }
            }
        }

        var accessor = {};
        if (this.get("consumerSecret") !=='') {
            accessor.consumerSecret = this.get("consumerSecret");
            accessor.consumerSecret = pm.envManager.getCurrentValue(accessor.consumerSecret);
        }
        if (this.get("tokenSecret") !=='') {
            accessor.tokenSecret = this.get("tokenSecret");
            accessor.tokenSecret = pm.envManager.getCurrentValue(accessor.tokenSecret);
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
        var request = this.get("request");
        request.trigger("updateModel");

        var i, j, count, length;
        var params = [];

        var urlParams = request.getUrlParams();
        var bodyParams = [];

        var url = request.get("url");
        var body = request.get("body");
        var dataMode = body.get("dataMode");
        var method = request.get("method");

        var bodyParams = body.get("dataAsObjects");

        params = params.concat(urlParams);
        params = params.concat(bodyParams);

        params = this.removeOAuthKeys(params);

        var signatureKey = "oauth_signature";

        var oAuthParams = [];

        var signatureParams = [
            {key: "oauth_consumer_key", value: this.get("consumerKey")},
            {key: "oauth_token", value: this.get("token")},
            {key: "oauth_signature_method", value: this.get("signatureMethod")},
            {key: "oauth_timestamp", value: this.get("timestamp")},
            {key: "oauth_nonce", value: this.get("nonce")},
            {key: "oauth_version", value: this.get("version")}
        ];

        for(i = 0; i < signatureParams.length; i++) {
            var param = signatureParams[i];
            param.value = pm.envManager.getCurrentValue(param.value);
            oAuthParams.push(param);
        }

        //Convert environment values
        for (i = 0, length = params.length; i < length; i++) {
            params[i].value = pm.envManager.getCurrentValue(params[i].value);
        }

        var signature = this.generateSignature();

        if (signature === null) {
            return;
        }

        oAuthParams.push({key: signatureKey, value: signature});

        var addToHeader = this.get("header");

        if (addToHeader) {
            var realm = this.get("realm");
            var authHeaderKey = "Authorization";
            var rawString = "OAuth realm=\"" + encodeURIComponent(realm) + "\",";
            var len = oAuthParams.length;

            for (i = 0; i < len; i++) {
                rawString += encodeURIComponent(oAuthParams[i].key) + "=\"" + encodeURIComponent(oAuthParams[i].value) + "\",";
            }

            rawString = rawString.substring(0, rawString.length - 1);
            request.setHeader(authHeaderKey, rawString);
            request.trigger("customHeaderUpdate");
        } else {
            params = params.concat(oAuthParams);

            if (!request.isMethodWithBody(method)) {
                console.log("Setting URL params", params);

                request.setUrlParamString(params);
                request.trigger("customURLParamUpdate");
            } else {
                if (dataMode === 'urlencoded') {
                    body.loadData("urlencoded", params, true);
                }
                else if (dataMode === 'params') {
                    body.loadData("params", params, true);
                }
                else if (dataMode === 'raw') {
                    request.setUrlParamString(params);
                    request.trigger("customURLParamUpdate");
                }
            }
        }
    }
});
