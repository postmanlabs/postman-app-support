var UserStatus = Backbone.View.extend({
	initialize: function() {
		var model = this.model;

		model.on("login", this.render, this);
		model.on("logout", this.render, this);

		$("#user-status-not-logged-in").on("click", function() {
			$("#user-status-not-logged-in").html("Loading...");
			model.login();
		});

		$("#user-status-shared-collections").on("click", function() {
			console.log("Open shared collections window");
		});

		$("#user-status-logout").on("click", function() {
			$("#user-status-not-logged-in").html("Log in");
			model.logout();
		});

		this.render();
	},

	render: function() {
		console.log("Logout triggered", this.model.get("id"));

		if (pm.features.isFeatureEnabled(FEATURES.USER)) {
			$("#user-status").css("display", "block");
		}

		var id = this.model.get("id");
		var name = this.model.get("name");

		if (id !== 0) {
			$("#user-status-false").css("display", "none");
			$("#user-status-true").css("display", "block");
			$("#user-status-username").html(name);
		}
		else {
			$("#user-status-not-logged-in").html("Sign in");
			$("#user-status-false").css("display", "block");
			$("#user-status-true").css("display", "none");
			$("#user-status-username").html("");
		}
	}
});