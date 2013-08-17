var DeleteCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("deleteCollectionRequest", this.render, this);

        $('#modal-delete-collection-request-yes').on("click", function () {
            var id = $(this).attr('data-id');
            model.deleteCollectionRequest(id);
        });
    },

    render: function(request) {
        $('#modal-delete-collection-request-yes').attr('data-id', request.id);
        $('#modal-delete-collection-request-name').html(request.name);
        $('#modal-delete-collection-request').modal('show');
    }
});
