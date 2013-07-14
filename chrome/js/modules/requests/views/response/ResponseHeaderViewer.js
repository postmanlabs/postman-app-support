var ResponseHeaderViewer = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var response = model.get("response");
        response.on("finishedLoadResponse", this.load, this);
    },

    load:function (data) {
        var model = this.model;
        var request = model;
        var response = model.get("response");
        var headers = response.get("headers");        

        $('.response-tabs li[data-section="headers"]').html("Headers (" + headers.length + ")");
        $('#response-headers').html("");
        $("#response-headers").append(Handlebars.templates.response_headers({"items":headers}));
        $('.response-header-name').popover({
            trigger: "hover",
        });
    },
});