var ShareCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        if (pm.features.isFeatureEnabled(FEATURES.DIRECTORY)) {
            $("share-collection-directory-features").css("display", "block");
        }

        $('#share-collection-get-link').on("click", function () {
            var id = $(this).attr('data-collection-id');
            var isChecked = $("#share-collection-is-public").is(":checked");

            model.uploadCollection(id, isChecked, true, function (link) {
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

        model.on("shareCollectionModal", this.show, this);
    },

    show: function(id) {
        var collection = this.model.get(id);

        $("#modal-share-collection").modal("show");

        $('#share-collection-get-link').attr("data-collection-id", id);
        $('#share-collection-download').attr("data-collection-id", id);
        $('#share-collection-link').css("display", "none");

        if (pm.user.isLoggedIn()) {
            if (collection.get("remote_id") !== 0) {
                $('#share-collection-directory-features').css("display", "none");
                $('#share-collection-get-link').html("Update");
            }
            else {
                $('#share-collection-directory-features').css("display", "block");
                $('#share-collection-get-link').html("Upload");
            }
        }
        else {
            $('#share-collection-directory-features').css("display", "none");
            $('#share-collection-get-link').html("Upload");
        }
    },

    render: function() {

    }
});
