var ResponseHeaderViewer = Backbone.View.extend({
    initialize: function() {

    },

    loadHeaders:function (data) {
        // TODO Set this in the model
        pm.request.response.headers = pm.request.unpackResponseHeaders(data);

        if(pm.settings.getSetting("usePostmanProxy") === true) {
            var count = pm.request.response.headers.length;
            for(var i = 0; i < count; i++) {
                if(pm.request.response.headers[i].key === "Postman-Location") {
                    pm.request.response.headers[i].key = "Location";
                    pm.request.response.headers[i].name = "Location";
                    break;
                }
            }
        }

        $('#response-headers').html("");

        // TODO Set this in the model
        pm.request.response.headers = _.sortBy(pm.request.response.headers, function (header) {
            return header.name;
        });


        $("#response-headers").append(Handlebars.templates.response_headers({"items":pm.request.response.headers}));
        $('.response-header-name').popover({
            trigger: "hover",
        });
    },
});