var RequestClipboard = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var response = model.get("response");

        $("#response-copy-button").on("click", function() {
            var scrollTop = $(window).scrollTop();
            copyToClipboard(response.get("text"));
            $(document).scrollTop(scrollTop);
        });
    }
})