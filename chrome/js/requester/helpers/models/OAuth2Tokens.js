var OAuth2Token = Backbone.Model.extend({
	defaults: function() {
		return {
		    "id": "",
		    "name": "OAuth2 Token",
		    "access_token": "",
		    "expires_in": 0,
		    "timestamp": 0
		};
	}

});

var OAuth2Tokens = Backbone.Collection.extend({
	model: OAuth2Token,

	comparator: function(a, b) {
	    var counter;

	    var at = a.get("timestamp");
	    var bt = b.get("timestamp");

	    return at > bt;
	},

	initialize: function() {
		pm.mediator.on("addOAuth2Token", this.addAccessToken, this);
		pm.mediator.on("updateOAuth2Token", this.updateAccessToken, this);
		this.loadAllAccessTokens();
	},

	loadAllAccessTokens: function() {
		var collection = this;

		pm.indexedDB.oAuth2AccessTokens.getAllAccessTokens(function(accessTokens) {
			collection.add(accessTokens, {merge: true});
			collection.trigger("change");
		});
	},

	addAccessToken: function(tokenData) {
		var collection = this;

		var id = guid();
		var accessToken = {
			"id": guid(),
			"timestamp": new Date().getTime(),
			"data": tokenData
		};

		if (tokenData.hasOwnProperty("access_token")) {
			accessToken.access_token = tokenData.access_token;
		}

		pm.indexedDB.oAuth2AccessTokens.addAccessToken(accessToken, function(a) {
			var at = new OAuth2Token(accessToken);
			collection.add(at, {merge: true});
			console.log("OAuth2Tokens, Calling addedOAuth2Token");
			pm.mediator.trigger("addedOAuth2Token", a);
		});
	},

	updateAccessToken: function(params) {
		var token = this.get(params.id);
		token.set("name", params.name);
		pm.indexedDB.oAuth2AccessTokens.updateAccessToken(token.toJSON(), function(a) {
			console.log("Updated access token");
			pm.mediator.trigger("updatedOAuth2Token", a.id);
		});
	},

	deleteAccessToken: function(id) {
		console.log("Removing access token");
		this.remove(id);
		pm.indexedDB.oAuth2AccessTokens.deleteAccessToken(id, function() {
			console.log("Deleted token");
		});
	},

	addAccessTokenToRequest: function(id, type) {
		var token = this.get(id);
		var data = token.get("data");
		var index = arrayObjectIndexOf(data, "access_token", "key");

		if (type === "url") {
			var accessTokenParam = {
				key: "access_token",
				value: data[index].value
			};
			pm.mediator.trigger("addRequestURLParam", accessTokenParam);
		}
		else if (type === "header") {
			var accessTokenHeader = {
				key: "Authorization",
				value: "Bearer " + data[index].value
			};
			pm.mediator.trigger("addRequestHeader", accessTokenHeader);
			// TODO Not implemented yet
		}

	}
});