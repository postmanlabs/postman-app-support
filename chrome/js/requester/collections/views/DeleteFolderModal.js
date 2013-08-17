var DeleteFolderModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        $('#modal-delete-folder-yes').on("click", function () {
            var id = $(this).attr('data-id');
            model.deleteFolder(id, true);
        });

        $("#modal-delete-folder").on("shown", function () {
            pm.app.trigger("modalOpen", "#modal-delete-folder");
        });

        $("#modal-delete-folder").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    render: function() {

    }
});
