var User = Backbone.Model.extend({
	defaults: function() {
	    return {
	        "id": 0,
	        "name": "",
	        "access_token": "",
	        "refresh_token": "",
	        "expires_in": 0,
	        "link": ""
	    };
	},

	setDefaults: function() {
		this.set("id", 0);
		this.set("name", "");
		this.set("access_token", "");
		this.set("refresh_token", "");
		this.set("expires_in", 0);
		this.set("link", "");

		pm.storage.setValue({"user": this.toJSON()}, function() {
			console.log("Stored the value");
		});
	},

	initialize: function() {
		var model = this;

		pm.storage.getValue("user", function(u) {
			if (u) {
				model.set("id", u.id);
				model.set("name", u.name);
				model.set("access_token", u.access_token);
				model.set("refresh_token", u.refresh_token);
				model.set("expires_in", u.expires_in);
				model.trigger("login", model);
			}
		});

	},

	login: function() {
		var model = this;

		chrome.identity.launchWebAuthFlow({'url': 'http://localhost/postman/html/client-login', 'interactive': true},
			function(redirect_url) {
				var params = getUrlVars(redirect_url, true);
				model.set("id", params.user_id);
				model.set("name", decodeURIComponent(params.name));
				model.set("access_token", decodeURIComponent(params.access_token));
				model.set("refresh_token", decodeURIComponent(params.refresh_token));
				model.set("expires_in", params.expires_in);

				pm.storage.setValue({"user": model.toJSON()}, function() {
					console.log("Stored the value");
				});

				model.trigger("login", model);
				/* Extract token from redirect_url */
			}
		);
	},

	logout: function() {
		this.setDefaults();
		this.trigger("logout");
	}

});