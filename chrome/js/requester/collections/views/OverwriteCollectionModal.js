var OverwriteCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("overwriteCollection", this.render, this);

        $('#modal-overwrite-collection-overwrite').on("click", function () {
            var originalCollectionId = model.originalCollectionId;
            var toBeImportedCollection = model.toBeImportedCollection;

            model.overwriteCollection(originalCollectionId, toBeImportedCollection);
        });

        $('#modal-overwrite-collection-duplicate').on("click", function () {
            var originalCollectionId = model.originalCollectionId;
            var toBeImportedCollection = model.toBeImportedCollection;

            model.duplicateCollection(toBeImportedCollection);
        });
    },

    render: function(collection) {
        $("#modal-overwrite-collection-name").html(collection.name);
        $("#modal-overwrite-collection-overwrite").attr("data-collection-id", collection.id);
        $("#modal-overwrite-collection-duplicate").attr("data-collection-id", collection.id);
        $("#modal-overwrite-collection").modal("show");
    }
});
