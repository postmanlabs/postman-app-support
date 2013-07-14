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
