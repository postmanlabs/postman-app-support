var EditCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("showEditModal", this.render, this);

        $('#edit-collection-update-drive').on("click", function() {
            var id = $(this).attr('data-collection-id');
            console.log("Run change queue");
            pm.drive.fetchChanges();
        });

        $('#form-edit-collection').submit(function() {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();
            model.updateCollectionMeta(id, name);
            $('#modal-edit-collection').modal('hide');
            return false;
        });

        $('#modal-edit-collection .btn-primary').click(function () {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();
            model.updateCollectionMeta(id, name);
            $('#modal-edit-collection').modal('hide');
        });

        $("#modal-edit-collection").on("shown", function () {
            $("#modal-edit-collection .collection-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection");
        });

        $("#modal-edit-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function(c) {
        console.log(event, c);
        var collection = c.toJSON();

        $('#form-edit-collection .collection-id').val(collection.id);
        $('#form-edit-collection .collection-name').val(collection.name);

        $('#modal-edit-collection').modal('show');
    }
});