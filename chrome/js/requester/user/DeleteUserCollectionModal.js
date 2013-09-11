var DeleteUserCollectionModal = Backbone.View.extend({
    initialize: function() {
        $('#modal-delete-user-collection-yes').on("click", function () {
            var id = $(this).attr('data-collection-id');
            pm.mediator.trigger("deleteSharedCollection", id)
        });

        $("#modal-delete-user-collection").on("shown", function () {
            pm.app.trigger("modalOpen", "#modal-delete-user-collection");
        });

        $("#modal-delete-user-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });

        pm.mediator.on("confirmDeleteSharedCollection", this.render, this);
    },

    render: function(id) {
        $('#modal-delete-user-collection-yes').attr("data-collection-id", id);
        $('#modal-delete-user-collection').modal("show");
    }
});
