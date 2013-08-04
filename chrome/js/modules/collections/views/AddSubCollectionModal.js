var AddSubCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("showAddSubModal", this.render, this);

        $('#add-sub-collection').submit(function () {
            var parentId = $('#add-sub-collection-parent-id').val();
            var name = $('#add-sub-collection-name').val();
            model.addSubCollection(parentId, name);
            $('#add-sub-collection-name').val("");
            $('#modal-add-sub-collection').modal('hide');
            return false;
        });

        $('#modal-add-sub-collection .btn-primary').click(function () {
            var parentId = $('#add-sub-collection-parent-id').val();
            var name = $('#add-sub-collection-name').val();
            model.addSubCollection(parentId, name);
            $('#add-sub-collection-name').val("");
            $('#modal-add-sub-collection').modal('hide');
            return false;
        });

        $("#modal-add-sub-collection").on("shown", function () {
            $("#add-sub-collection-name").focus();
            pm.app.onModalOpen("#modal-add-sub-collection");
        });

        $("#modal-add-sub-collection").on("hidden", function () {
            pm.app.onModalClose();
        });
    },

    render: function(c) {
        $("#add-sub-collection-header").html("Add sub-collection inside " + c.get("name"));
        $("#add-sub-collection-parent-id").val(c.get("id"));
        $('#modal-add-sub-collection').modal('show');
    }
});
