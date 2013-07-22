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

            var filename = "response.pdf";
            var type = "pdf";

            pm.filesystem.saveAndOpenFile(filename, responseData, type, function () {
                noty(
                    {
                        type:'success',
                        text:'Saved PDF to disk',
                        layout:'topCenter',
                        timeout:750
                    });
            });
    	}    	
    	else if (previewType === "pdf" && responseRawDataType === "text") {
    	 	// Trigger an arraybuffer request with the same parameters       	 	
            model.trigger("send", "arraybuffer");
    	}
    }
});