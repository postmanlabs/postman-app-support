var AddCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        $('#form-new-collection').submit(function () {
            var name = $('#new-collection-blank').val();
            model.addCollection(name);
            $('#new-collection-blank').val("");
            $('#modal-new-collection').modal('hide');
            return false;
        });

        $('#modal-new-collection .btn-primary').click(function () {
            var name = $('#new-collection-blank').val();
            model.addCollection(name);
            $('#new-collection-blank').val("");
            $('#modal-new-collection').modal('hide');
            return false;
        });

        $("#modal-new-collection").on("shown", function () {
            $("#new-collection-blank").focus();
            pm.app.trigger("modalOpen", "#modal-new-collection");
        });

        $("#modal-new-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    render: function() {

    }
});
