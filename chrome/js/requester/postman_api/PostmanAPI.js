var PostmanAPI = Backbone.Model.extend({
	defaults: function() {
		return {
			"web_url": pm.webUrl
		}
	},

	initialize: function() {
		console.log("This is going to be the awesome postman API!");
	},

	isTokenValid: function() {
		var user = pm.user;

		var expiresIn = user.get("expires_in");
		var loggedInAt = user.get("logged_in_at");

		var now = new Date().getTime();

		if (loggedInAt + expiresIn > now) {
			return true;
		}
		else {
			return false;
		}
	},

	exchangeRefreshToken: function(successCallback) {
		console.log("Trying to exchangeRefreshToken");

		var postUrl = pm.webUrl + "/client-oauth2-refresh";
		postUrl += "?user_id=" + pm.user.get("id");

		var parameters = {
			"grant_type": "refresh_token",
			"refresh_token": pm.user.get("refresh_token")
		};

		$.ajax({
			type: 'POST',
			url: postUrl,
			data: parameters,
			success: function(data) {
				console.log("Received refresh_token", data);

				if (data.hasOwnProperty("result")) {
					var result = data.hasOwnProperty("result");
					if (!result) {
						pm.mediator.trigger("invalidRefreshToken");
					}
				}
				else if (data.hasOwnProperty("access_token")) {
					pm.user.setAccessToken(data);
					if (successCallback) {
						successCallback();
					}
				}
			}
		})
	},

	logoutUser: function(userId, accessToken, successCallback) {
		var postUrl = pm.webUrl + '/client-logout';
	    postUrl += "?user_id=" + userId;
	    postUrl += "&access_token=" + accessToken;

		$.ajax({
			type: 'POST',
			url: postUrl,
			success: function() {
				if (successCallback) {
					successCallback();
				}
			}
		})
	},

	executeAuthenticatedRequest: function(func) {
		var isTokenValid = this.isTokenValid();

		if (isTokenValid) {
			func();
		}
		else {
			this.exchangeRefreshToken(function() {
				func();
			});
		}
	},

	uploadCollection: function(collectionData, isPublic, successCallback) {
		var uploadUrl = pm.webUrl + '/collections?is_public=' + isPublic;

		if (pm.user.isLoggedIn()) {
		    this.executeAuthenticatedRequest(function() {
		    	uploadUrl += "&user_id=" + pm.user.get("id");
		    	uploadUrl += "&access_token=" + pm.user.get("access_token");

		    	$.ajax({
		    	    type:'POST',
		    	    url:uploadUrl,
		    	    data:collectionData,
		    	    success:function (data) {
		    	    	if (successCallback) {
		    	    		successCallback(data);
		    	    	}
		    	    }
		    	});
		    });
		}
		else {
			$.ajax({
			    type:'POST',
			    url:uploadUrl,
			    data:collectionData,
			    success:function (data) {
			    	if (successCallback) {
			    		successCallback(data);
			    	}
			    }
			});
		}
	},

	getDirectoryCollections: function(startId, count, order, successCallback) {
		var getUrl = pm.webUrl + "/collections";
		getUrl += "?user_id=" + pm.user.get("id");
		getUrl += "&access_token=" + pm.user.get("access_token");
		getUrl += "&start_id=" + startId;
		getUrl += "&count=" + count;
		getUrl += "&order=" + order;

		$.ajax({
		    type:'GET',
		    url:getUrl,
		    success:function (collections) {
		    	if (successCallback) {
		    		successCallback(collections);
		    	}
		    }
		});
	},

	downloadDirectoryCollection: function(link_id, successCallback) {
	    var getUrl = pm.webUrl + "/collections/" + link_id;
	    getUrl += "?user_id=" + pm.user.get("id");
	    getUrl += "&access_token=" + pm.user.get("access_token");

	    $.get(getUrl, function (data) {
	    	if (successCallback) {
	    		successCallback(data);
	    	}
	    });
	},

	getUserCollections: function(successCallback) {
		this.executeAuthenticatedRequest(function() {
			var user = pm.user;

			var getUrl = pm.webUrl + "/users/" + user.get("id") + "/collections";
			getUrl += "?user_id=" + user.get("id");
			getUrl += "&access_token=" + user.get("access_token");

			$.ajax({
			    type:'GET',
			    url:getUrl,
			    success:function (data) {
			    	if (successCallback) {
			    		successCallback(data);
			    	}
			    }
			});
		});
	},

	deleteSharedCollection: function(id, successCallback) {
		this.executeAuthenticatedRequest(function() {
			var user = pm.user;

			var deleteUrl = pm.webUrl + "/users/" + user.get("id") + "/collections/" + id;
			deleteUrl += "?user_id=" + user.get("id");
			deleteUrl += "&access_token=" + user.get("access_token");

			$.ajax({
			    type:'DELETE',
			    url:deleteUrl,
			    success:function (data) {
			    	if (successCallback) {
			    		successCallback(data);
			    	}
			    }
			});
		});
	},

	getCollectionFromRemoteId: function(id, successCallback) {
		var getUrl = pm.webUrl + "/collections/" + id;
		getUrl += "?id_type=remote&user_id=" + pm.user.get("id");
		getUrl += "&access_token=" + pm.user.get("access_token");

		$.get(getUrl, function (data) {
			if (successCallback) {
				successCallback(data);
			}
		});
	}

})