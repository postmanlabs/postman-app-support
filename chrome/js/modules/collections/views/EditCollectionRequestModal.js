var EditCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("editCollectionRequest", this.render, this);

        $('#form-edit-collection-request').submit(function() {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();
            model.updateCollectionRequestMeta(id, name, description);
            return false;
        });

        $('#modal-edit-collection-request .btn-primary').click(function () {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();
            model.updateCollectionRequestMeta(id, name, description);
            $('#modal-edit-collection-request').modal('hide');
        });

        $("#modal-edit-collection-request").on("shown", function () {
            $("#modal-edit-collection-request .collection-request-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection-request");
        });

        $("#modal-edit-collection-request").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function(request) {
        $('#form-edit-collection-request .collection-request-id').val(request.id);
        $('#form-edit-collection-request .collection-request-name').val(request.name);
        $('#form-edit-collection-request .collection-request-description').html(request.description);
        $('#modal-edit-collection-request').modal('show');
    }
});
