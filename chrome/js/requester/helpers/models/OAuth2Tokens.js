var OAuth2Token = Backbone.Model.extend({
	defaults: function() {
		return {
		    "id": "",
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
		this.loadAllAccessTokens();

		pm.mediator.on("addOAuth2Token", this.addAccessToken, this);
	},

	loadAllAccessTokens: function() {
		var collection = this;

		pm.indexedDB.oAuth2AccessTokens.getAllAccessTokens(function(accessTokens) {
			console.log(accessTokens);
			collection.set(accessTokens, {merge: true});
		});
	},

	addAccessToken: function(tokenData) {
		var id = guid();
		var accessToken = {
			"id": guid(),
			"timestamp": new Date().getTime(),
			"data": tokenData
		};

		if (tokenData.hasOwnProperty("access_token")) {
			accessToken.access_token = tokenData.access_token;
		}

		console.log("Adding access token", accessToken);
		pm.indexedDB.oAuth2AccessTokens.addAccessToken(accessToken, function(a) {
			var at = new OAuth2Token(accessToken);
			collection.addAccessToken(at, {merge: true});
			console.log("Added access token", at);
		});
	}
});