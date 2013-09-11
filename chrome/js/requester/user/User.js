var User = Backbone.Model.extend({
	defaults: function() {
	    return {
	        "id": 0,
	        "name": "",
	        "access_token": "",
	        "refresh_token": "",
	        "expires_in": 0,
	        "link": "",
	        "collections": []
	    };
	},

	setDefaults: function() {
		this.set("id", 0);
		this.set("name", "");
		this.set("access_token", "");
		this.set("refresh_token", "");
		this.set("expires_in", 0);
		this.set("link", "");

		if (pm.features.isFeatureEnabled(FEATURES.USER)) {
			pm.storage.setValue({"user": this.toJSON()}, function() {
			});
		}
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

				if (pm.features.isFeatureEnabled(FEATURES.USER)) {
					model.getCollections();
					model.trigger("login", model);
				}
			}
		});

		pm.mediator.on("refreshSharedCollections", this.getCollections, this);
		pm.mediator.on("deleteSharedCollection", this.onDeleteSharedCollection, this);
	},

	isLoggedIn: function() {
		return this.get("id") !== 0;
	},

	login: function() {
		var model = this;

		chrome.identity.launchWebAuthFlow({'url': pm.webUrl + '/client-login', 'interactive': true},
			function(redirect_url) {
				if (chrome.runtime.lastError) {
					pm.mediator.trigger("notifyError", "Could not initiate OAuth 2 flow");
				}
				else {
					var params = getUrlVars(redirect_url, true);
					model.set("id", params.user_id);
					model.set("name", decodeURIComponent(params.name));
					model.set("access_token", decodeURIComponent(params.access_token));
					model.set("refresh_token", decodeURIComponent(params.refresh_token));
					model.set("expires_in", params.expires_in);

					pm.storage.setValue({"user": model.toJSON()}, function() {
					});

					model.getCollections();

					model.trigger("login", model);
					/* Extract token from redirect_url */
				}

			}
		);
	},

	logout: function() {
		this.setDefaults();
		this.trigger("logout");
	},

	getCollections: function() {
		var model = this;

		var getUrl = pm.webUrl + "/users/" + this.get("id") + "/collections";
		getUrl += "?user_id=" + this.get("id");
		getUrl += "&access_token=" + this.get("access_token");

		$.ajax({
		    type:'GET',
		    url:getUrl,
		    success:function (data) {
		    	var c;

		    	if (data.hasOwnProperty("collections")) {
			    	for(var i = 0; i < data.collections.length; i++) {
			    		c = data.collections[i];
			    		c.is_public = c.is_public === "1" ? true : false;
			    		c.updated_at_formatted = new Date(c.updated_at).toDateString();
			    	}

			    	model.set("collections", data.collections);
			    	model.trigger("change:collections");
		    	}

		    }
		});
	},

	onDeleteSharedCollection: function(id) {
		var model = this;
		var deleteUrl = pm.webUrl + "/users/" + this.get("id") + "/collections/" + id;
		deleteUrl += "?user_id=" + this.get("id");
		deleteUrl += "&access_token=" + this.get("access_token");

		$.ajax({
		    type:'DELETE',
		    url:deleteUrl,
		    success:function (data) {
		    	var collections = model.get("collections");
		    	var index = arrayObjectIndexOf(collections, id, "id");

		    	if (index >= 0) {
		    		collections.splice(index, 1);
		    	}

		    	model.trigger("change:collections");
		    }
		});
	}

});