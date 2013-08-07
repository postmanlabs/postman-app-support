var AddFolderModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("showAddFolderModal", this.render, this);

        $('#add-folder').submit(function () {
            var parentId = $('#add-folder-parent-id').val();
            var name = $('#add-folder-name').val();
            model.addFolder(parentId, name);
            $('#add-folder-name').val("");
            $('#modal-add-folder').modal('hide');
            return false;
        });

        $('#modal-add-folder .btn-primary').click(function () {
            var parentId = $('#add-folder-parent-id').val();
            var name = $('#add-folder-name').val();
            model.addFolder(parentId, name);
            $('#add-folder-name').val("");
            $('#modal-add-folder').modal('hide');
            return false;
        });

        $("#modal-add-folder").on("shown", function () {
            $("#add-folder-name").focus();
            pm.app.trigger("modalOpen", "#modal-add-folder");
        });

        $("#modal-add-folder").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    render: function(c) {
        $("#add-folder-header").html("Add folder inside " + c.get("name"));
        $("#add-folder-parent-id").val(c.get("id"));
        $('#modal-add-folder').modal('show');
    }
});
