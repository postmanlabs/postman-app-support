var ResponseBodyPDFViewer = Backbone.View.extend({
    initialize: function() {
    	var model = this.model;
    	var response = model.get("response");
    	response.on("finishedLoadResponse", this.render, this);
    },

    render: function() {
    	var model = this.model;
    	var response = model.get("response");
    	var previewType = response.get("previewType");
    	var responseRawDataType = response.get("rawDataType");

    	if (previewType === "pdf" && responseRawDataType === "arraybuffer") {
            console.log("Render the PDF");
            
	    	var responseData = response.get("responseData");    	
	    	$("#response-as-preview").html("");
	    	$("#response-as-preview").css("display", "block");

	    	pm.filesystem.renderResponsePreview("response.pdf", responseData, "pdf", function (response_url) {
	    	    $("#response-as-preview").html("<iframe src='" + response_url + "'/>");
	    	});
    	}    	
    	else if (previewType === "pdf" && responseRawDataType === "text") {
    	 	// Trigger an arraybuffer request with the same parameters       	 	
    	}
    }
});