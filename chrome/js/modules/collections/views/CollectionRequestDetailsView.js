// TODO This can be made part of the RequestEditor - RequestMetaViewer
var CollectionRequestDetailsView = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("displayCollectionRequest", this.show, this);
        model.on("updateCollectionRequest", this.render, this);

        $('#request-samples').on("click", ".sample-response-name", function () {
            var id = $(this).attr("data-id");
            model.loadResponseInEditor(id);
        });

        $('#request-samples').on("click", ".sample-response-delete", function () {
            var id = $(this).attr("data-id");
            model.removeSampleResponse(id);
        });

        $('.request-meta-actions-togglesize').on("click", function () {
            var action = $(this).attr('data-action');

            if (action === "minimize") {
                $(this).attr("data-action", "maximize");
                $('.request-meta-actions-togglesize img').attr('src', 'img/circle_plus.png');
                $("#request-description-container").slideUp(100);
            }
            else {
                $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');
                $(this).attr("data-action", "minimize");
                $("#request-description-container").slideDown(100);
            }
        });

        $('#request-meta').on("mouseenter", function () {
            $('.request-meta-actions').css("display", "block");
        });

        $('#request-meta').on("mouseleave", function () {
            $('.request-meta-actions').css("display", "none");
        });
    },

    show: function() {
        pm.layout.sidebar.select("collections");
        $('#request-meta').css("display", "block");
        $('#request-name').css("display", "block");
        $('#request-description').css("display", "block");

        //TODO Move this to the global Sidebar view
        $('#sidebar-selectors a[data-id="collections"]').tab('show');
    },

    hide: function() {
        $('#request-meta').css("display", "none");
    },

    render: function(request) {
        var currentId = pm.request.get("collectionRequestId");

        if (currentId === request.id) {
            $('#request-name').html(request.name);
            $('#request-description').html(request.description);
        }
    }
});