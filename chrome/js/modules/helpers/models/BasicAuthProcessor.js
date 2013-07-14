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