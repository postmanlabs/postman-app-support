// TODO Can be made cleaner by moving code for fetching stuff to the view. Already doing it. Just need to sort out signatureParam class stuff
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
        this.set("timestamp", OAuth.timestamp());
        this.set("nonce", OAuth.nonce(6));
    },

    generateSignature: function () {
        //Make sure the URL is urlencoded properly
        //Set the URL keyval editor as well. Other get params disappear when you click on URL params again
        var request = this.get("request");

        var url = request.get("url");
        if (url === '') {
            $('#request-helpers').css("display", "block");
            alert('Please enter the URL first.');
            return null;
        }

        var processedUrl;

        var realm = $('#request-helper-oauth1-realm').val();

        var method = request.get("method");
        var requestBody = request.get("body");

        if (realm === '') {
            processedUrl = pm.envManager.getCurrentValue(url).trim();
        }
        else {
            processedUrl = pm.envManager.getCurrentValue(realm);
        }

        processedUrl = ensureProperUrl(processedUrl);

        if (processedUrl.indexOf('?') > 0) {
            processedUrl = processedUrl.split("?")[0];
        }

        var message = {
            action: processedUrl,
            method: method,
            parameters: []
        };

        //all the fields defined by oauth
        $('input.signatureParam').each(function () {
            if ($(this).val() !=='') {
                var val = $(this).val();
                val = pm.envManager.getCurrentValue(val);
                message.parameters.push([$(this).attr('key'), val]);
            }
        });

        //Get parameters
        var urlParams = request.getUrlParams();

        var bodyParams = requestBody.get("dataAsObjects");

        var params = _.union(urlParams, bodyParams);

        console.log("URL params are", params);

        for (var i = 0; i < params.length; i++) {
            var param = params[i];
            if (param.key) {
                param.value = pm.envManager.getCurrentValue(param.value);
                message.parameters.push([param.key, param.value]);
            }
        }

        var accessor = {};
        if ($('input[key="oauth_consumer_secret"]').val() !=='') {
            accessor.consumerSecret = $('input[key="oauth_consumer_secret"]').val();
            accessor.consumerSecret = pm.envManager.getCurrentValue(accessor.consumerSecret);
        }
        if ($('input[key="oauth_token_secret"]').val() !=='') {
            accessor.tokenSecret = $('input[key="oauth_token_secret"]').val();
            accessor.tokenSecret = pm.envManager.getCurrentValue(accessor.tokenSecret);
        }

        console.log("Generating using", message, accessor);

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

        // TODO Need to test if this works
        var bodyParams = body.get("dataAsObjects");

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

        //Convert environment values
        for (i = 0, length = params.length; i < length; i++) {
            params[i].value = pm.envManager.getCurrentValue(params[i].value);
        }

        for (j = 0, length = oAuthParams.length; i < length; i++) {
            oAuthParams[i].value = pm.envManager.getCurrentValue(oAuthParams[i].value);
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
                realm = pm.envManager.getCurrentValue(url.trim());
            }

            if (realm.indexOf('?') > 0) {
                realm = realm.split("?")[0];
            }

            var authHeaderKey = "Authorization";
            var rawString = "OAuth realm=\"" + realm + "\",";
            var len = oAuthParams.length;
            
            for (i = 0; i < len; i++) {
                rawString += encodeURIComponent(oAuthParams[i].key) + "=\"" + encodeURIComponent(oAuthParams[i].value) + "\",";
            }

            rawString = rawString.substring(0, rawString.length - 1);
            request.setHeader(authHeaderKey, rawString);
        } else {            
            params = params.concat(oAuthParams);

            if (!request.isMethodWithBody(method)) {
                request.setUrlParamString(params);                
            } else {                
                if (dataMode === 'urlencoded') {
                    body.loadData("urlencoded", oAuthParams, true);
                }
                else if (dataMode === 'params') {
                    body.loadData("params", oAuthParams, true);
                }
                else if (dataMode === 'raw') {
                    request.setUrlParamString(oAuthParams);                    
                }
            }
        }
    }
});
