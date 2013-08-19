var ShareCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        $('#share-collection-get-link').on("click", function () {
            var id = $(this).attr('data-collection-id');
            var isChecked = $("#share-collection-is-public").is(":checked");

            model.uploadCollection(id, isChecked, function (link) {
                $('#share-collection-link').css("display", "block");
                $('#share-collection-link').html(link);
            });
        });

        $('#share-collection-download').on("click", function () {
            var id = $(this).attr('data-collection-id');
            model.saveCollection(id);
        });

        $("#modal-share-collection").on("shown", function () {
            pm.app.trigger("modalOpen", "#modal-share-collection");
        });

        $("#modal-share-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    render: function() {

    }
});
