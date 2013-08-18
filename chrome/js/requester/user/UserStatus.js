var UserStatus = Backbone.View.extend({
	initialize: function() {
		var model = this.model;

		model.on("login", this.render, this);
		model.on("logout", this.render, this);

		console.log("Initialize user status");

		$("#user-status-not-logged-in").on("click", function() {
			model.login();
		});

		$("#user-status-username").on("click", function() {
			model.logout();
		});

		this.render();
	},

	render: function() {
		var id = this.model.get("id");
		var name = this.model.get("name");

		if (id !== 0) {
			$("#user-status-false").css("display", "none");
			$("#user-status-true").css("display", "block");
			$("#user-status-username").html(name);
		}
		else {
			$("#user-status-false").css("display", "block");
			$("#user-status-true").css("display", "none");
			$("#user-status-username").html("");
		}
	}
});