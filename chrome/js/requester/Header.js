var Header = Backbone.View.extend({
	initialize: function() {
		var donated = pm.settings.getSetting("haveDonated");

		if(donated) {
			$("#donate-link").css("display", "none");
		}
		else {
			$("#donate-link").css("display", "inline-block");
		}

		pm.mediator.on("donatedStatusChanged", function(donated) {
			if(donated) {
				$("#donate-link").css("display", "none");
			}
			else {
				$("#donate-link").css("display", "inline-block");
			}
		});

		$("#add-on-directory").on("click", function() {
			pm.mediator.trigger("openModule", "directory");
			pm.mediator.trigger("initializeDirectory");
		});

		$("#add-on-test-runner").on("click", function() {
			pm.mediator.trigger("openModule", "test_runner");
		});

		$("#logo").on("click", function() {
			pm.mediator.trigger("openModule", "requester");
		});

		$("#back-to-request").on("click", function() {
			pm.mediator.trigger("openModule", "requester");
		});

		pm.mediator.on("openModule", this.onOpenModule, this);

		this.render();
	},

	render: function() {
		if (pm.features.isFeatureEnabled(FEATURES.DIRECTORY)) {
			$("#add-ons").css("display", "block");
		}
	},

	onOpenModule: function(module) {
		if (module === "directory") {
			$("#add-ons").css("display", "none");
			$("#back-to-requester-container").css("display", "block");
		}
		else if (module === "requester") {
			$("#add-ons").css("display", "block");
			$("#back-to-requester-container").css("display", "none");
		}
	}

});