var UserCollections = Backbone.View.extend({
	initialize: function() {
		var model = this.model;

		model.on("login", this.render, this);
		model.on("logout", this.render, this);
		model.on("change:collections", this.render, this);

		var deleteUserCollectionModal = new DeleteUserCollectionModal();

		$("#user-collections-actions-upload-all").on("click", function() {
			console.log("Upload all collections");
			pm.mediator.trigger("uploadAllLocalCollections");
		});

		$("#user-collections-actions-download-all").on("click", function() {
			console.log("Download all collections");
			pm.mediator.trigger("downloadAllSharedCollections");
		});

		$("#user-collections-list").on("click", ".user-collection-action-download", function() {
			var id = parseInt($(this).attr("data-remote-id"), 10);
			pm.mediator.trigger("downloadSharedCollection", id);
		});

		$("#user-collections-list").on("click", ".user-collection-action-delete", function() {
			var id = $(this).attr("data-id");
			pm.mediator.trigger("confirmDeleteSharedCollection", id);
		});

		this.render();
	},

	render: function() {
		var id = this.model.get("id");
		var name = this.model.get("name");

		if (id !== 0) {
			$('#user-collections-list tbody').html("");
			$('#user-collections-list tbody').append(Handlebars.templates.user_collections_list({"items":this.model.get("collections")}));
		}
		else {
			$('#user-collections-list tbody').html("");
		}
	}
});