var OAuth2TokenFetcher = Backbone.Model.extend({
    defaults: function() {
        return {
            "id": "oAuth2",
            "authorization_url": "",
            "access_token_url": "",
            "client_id": "",
            "client_secret": "",
            "scope": ""
        };
    },

    initialize: function() {
        var model = this;

        this.on("startAuthorization", this.startAuthorization);

        this.on("change", this.updateDB, this);

        pm.indexedDB.helpers.getHelper("oAuth2", function(helper) {
            if (helper) {
                model.set(helper);
            }
        });
    },

    updateDB: function() {
        var helper = {
            "id": this.get("id"),
            "authorization_url": this.get("authorization_url"),
            "access_token_url": this.get("access_token_url"),
            "client_id": this.get("client_id"),
            "client_secret": this.get("client_secret"),
            "scope": this.get("scope"),
            "timestamp": new Date().getTime()
        };

        pm.indexedDB.helpers.addHelper(helper, function(h) {
        });
    },

    startAuthorization: function(params) {
        var authParams = {
            "authorization_url": pm.envManager.getCurrentValue(_.clone(params["authorization_url"])),
            "access_token_url": pm.envManager.getCurrentValue(_.clone(params["access_token_url"])),
            "client_id": pm.envManager.getCurrentValue(_.clone(params["client_id"])),
            "client_secret": pm.envManager.getCurrentValue(_.clone(params["client_secret"])),
            "scope": pm.envManager.getCurrentValue(_.clone(params["scope"])),
        };

        this.set(params);

        var postmanAuthUrl = pm.webUrl + "/oauth2/start";
        postmanAuthUrl += "?authorization_url=" + encodeURIComponent(authParams["authorization_url"]);
        postmanAuthUrl += "&access_token_url=" + encodeURIComponent(authParams["access_token_url"]);
        postmanAuthUrl += "&client_id=" + encodeURIComponent(authParams["client_id"]);
        postmanAuthUrl += "&client_secret=" + encodeURIComponent(authParams["client_secret"]);
        postmanAuthUrl += "&scope=" + encodeURIComponent(authParams["scope"]);

        console.log(postmanAuthUrl);

        chrome.identity.launchWebAuthFlow({'url': postmanAuthUrl, 'interactive': true},
            function(redirect_url) {
                if (chrome.runtime.lastError) {
                    pm.mediator.trigger("notifyError", "Could not initiate OAuth 2 flow");
                }
                else {
                    var params = getUrlVars(redirect_url);
                    console.log("Show form", params);
                    pm.mediator.trigger("addOAuth2Token", params);
                }
            }
        );
    }
});