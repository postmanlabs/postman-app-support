var OAuth2Manager = Backbone.View.extend({
	initialize: function() {
		var model = this;
		var view = this;

		var oAuth2Form = new OAuth2Form({model: this.model});
		// Click event to load access_token
		// Delete event
		$("#request-helper-oAuth2-access-token-get").on("click", function () {
		    view.showAccessTokenForm();
		});
	},

	showAccessTokenForm: function() {
	    $("#request-helper-oAuth2-access-tokens-container").css("display", "none");
	    $("#request-helper-oAuth2-access-token-form").css("display", "block");
	},

	showAccessTokens: function() {
	    $("#request-helper-oAuth2-access-tokens-container").css("display", "block");
	    $("#request-helper-oAuth2-access-token-form").css("display", "none");
	},

	render: function() {
		// Render list event
	}

});