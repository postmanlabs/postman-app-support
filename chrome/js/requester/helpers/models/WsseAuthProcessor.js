var WsseAuthProcessor = Backbone.Model.extend({
    defaults: function() {
        return {
            "username": null,
            "password": null,
            "request": null
        };
    },

    initialize: function() {
        this.on("change", this.updateDB, this);

        var model = this;

        pm.indexedDB.helpers.getHelper("wsse", function(helper) {
            if (helper) {
                model.set(helper);
            }
        });
    },

    process: function() {
        var request = this.get("request");

        var headers = request.get("headers");
        var authHeaderKey = "X-WSSE";

        var username = this.get("username");
        var password = this.get("password");

        username = pm.envManager.getCurrentValue(username);
        password = pm.envManager.getCurrentValue(password);

        var time = (new Date()).toISOString();
        var nonce = '' + (Math.random() * 1000000000 + 1);
        var digest = CryptoJS.SHA1(nonce + time + password).toString(CryptoJS.enc.Latin1);

        var encodedString = 'UsernameToken'
            + ' Username="' + username + '",'
            + ' PasswordDigest="' + btoa(digest) + '",'
            + ' Nonce="' + btoa(nonce) + '",'
            + ' Created="' + time + '"';

        request.setHeader(authHeaderKey, encodedString);
        request.trigger("customHeaderUpdate");
    },

    updateDB: function() {
        var helper = {
            id: "wsse",
            username: this.get("username"),
            password: this.get("password"),
            timestamp: new Date().getTime()
        };

        pm.indexedDB.helpers.addHelper(helper, function(helper) {
        });
    }
});