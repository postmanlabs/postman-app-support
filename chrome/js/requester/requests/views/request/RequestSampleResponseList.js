var RequestSampleResponseList = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        model.on("loadRequest", this.render, this);
        model.on("change:responses", this.render, this);

        $("#request-samples").on("mouseenter", ".sample-response-container", function() {
        	var actionsEl = $('.sample-response-actions', this);
        	actionsEl.css('display', 'block');
        });

        $("#request-samples").on("mouseleave", ".sample-response-container", function() {
            var actionsEl = $('.sample-response-actions', this);
            actionsEl.css('display', 'none');
        });

        $("#request-samples").on("click", ".sample-response-actions-load", function() {
            var id = $(this).attr("data-id");
            view.loadResponse(id);
        });

        $("#request-samples").on("click", ".sample-response-actions-delete", function() {
            var id = $(this).attr("data-id");
            view.deleteResponse(id);
        });

        this.render();
    },

    loadResponse: function(id) {
        this.model.loadSampleResponseById(id);
    },

    deleteResponse: function(id) {
        this.model.deleteSampleResponseById(id);
    },

    render: function() {
    	var responses = this.model.get("responses");
        $("#request-samples-list").html("");

    	if (responses.length > 0) {
    		$("#request-samples").css("display", "block");
    		$("#request-samples-list").append(Handlebars.templates.sample_responses({"items": responses}));
    	}
    	else {
    		$("#request-samples").css("display", "none");
    	}
    }
});