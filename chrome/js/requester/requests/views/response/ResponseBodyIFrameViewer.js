var ResponseBodyIFrameViewer = Backbone.View.extend({
    initialize: function() {
    	var model = this.model;
    	var response = model.get("response");
    	response.on("finishedLoadResponse", this.render, this);
    },

    render: function() {
    	var model = this.model;
    	var request = model;
    	var response = model.get("response");
    	var previewType = response.get("previewType");
    	var text = response.get("text");

    	if (previewType === "html") {
    	    $("#response-as-preview").html("");
    	    var cleanResponseText = model.stripScriptTag(text);
    	    pm.filesystem.renderResponsePreview("response.html", cleanResponseText, "html", function (response_url) {
    	        $("#response-as-preview").html("<iframe></iframe>");
    	        $("#response-as-preview iframe").attr("src", response_url);
    	    });
    	}
    }
});