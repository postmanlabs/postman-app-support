var OAuth2TokenList = Backbone.View.extend({
	initialize: function() {
		var model = this.model;

		model.on("add", this.render, this);
		model.on("remove", this.render, this);
		model.on("change", this.render, this);

		// Click event to load access_token
		// Delete event

		$("#request-helper-oAuth2-access-tokens").on("mouseenter", ".oauth2-access-token-container", function() {
			var actionsEl = $('.oauth2-access-token-actions', this);
			actionsEl.css('display', 'block');
		});

		$("#request-helper-oAuth2-access-tokens").on("mouseleave", ".oauth2-access-token-container", function() {
		    var actionsEl = $('.oauth2-access-token-actions', this);
		    actionsEl.css('display', 'none');
		});

		$("#request-helper-oAuth2-access-tokens").on("click", ".oauth2-access-token-actions-load", function() {
		    var id = $(this).attr("data-id");
		    var location = $("#request-helper-oAuth2-options input[name='oAuth2-token-location']:checked").val();
		    model.addAccessTokenToRequest(id, location);
		});

		$("#request-helper-oAuth2-access-tokens").on("click", ".oauth2-access-token-actions-delete", function() {
		    var id = $(this).attr("data-id");
		    model.deleteAccessToken(id);
		});
	},

	render: function() {
		var tokens = this.model.toJSON();
		$("#request-helper-oAuth2-access-tokens").html("");
		$("#request-helper-oAuth2-access-tokens").append(Handlebars.templates.oauth2_access_tokens({"items": tokens}));
	}

});