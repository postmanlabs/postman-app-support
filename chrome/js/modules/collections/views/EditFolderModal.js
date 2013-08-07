var EditFolderModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("showEditFolderModal", this.render, this);

        $('#form-edit-folder').submit(function() {
            var id = $('#form-edit-folder .folder-id').val();
            var name = $('#form-edit-folder .folder-name').val();
            model.updateFolderMeta(id, name);
            $('#modal-edit-folder').modal('hide');
            return false;
        });

        $('#modal-edit-folder .btn-primary').click(function () {
            var id = $('#form-edit-folder .folder-id').val();
            var name = $('#form-edit-folder .folder-name').val();
            model.updateFolderMeta(id, name);
            $('#modal-edit-folder').modal('hide');
        });

        $("#modal-edit-folder").on("shown", function () {
            $("#modal-edit-folder .folder-name").focus();
            pm.app.trigger("modalOpen", "#modal-edit-folder");
        });

        $("#modal-edit-folder").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    render: function(folder) {
        console.log("Render edit folder");
                
        $('#form-edit-folder .folder-id').val(folder.id);
        $('#form-edit-folder .folder-name').val(folder.name);

        $('#modal-edit-folder').modal('show');
    }
});