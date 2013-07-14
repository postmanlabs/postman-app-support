var ResponseMetaViewer = Backbone.View.extend({
    initialize: function() {
    	var model = this.model;
    	var response = model.get("response");
    	response.on("finishedLoadResponse", this.render, this);
    },

    render: function() {
    	var model = this.model;
    	var request = model;
    	var response = model.get("response");
    	var time = response.get("time");

    	$('#response-status').css("display", "block");

    	$('#response-status').html(Handlebars.templates.item_response_code(response.get("responseCode")));
    	$('.response-code').popover({
    	    trigger: "hover"
    	});

    	$('#response-time .data').html(time + " ms");
    }
});