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

				model.getCollections();

				model.trigger("login", model);
			}
		});

		pm.mediator.on("refreshSharedCollections", this.getCollections, this);
		pm.mediator.on("deleteSharedCollection", this.onDeleteSharedCollection, this);
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
				});

				model.getCollections();

				model.trigger("login", model);
				/* Extract token from redirect_url */
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
		    	model.set("collections", data.collections);
		    	model.trigger("change:collections");
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
		    	console.log(collections, index, id);

		    	if (index >= 0) {
		    		collections.splice(index, 1);
		    	}

		    	model.trigger("change:collections");
		    }
		});
	}

});