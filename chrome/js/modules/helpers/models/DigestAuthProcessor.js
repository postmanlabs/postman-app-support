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
