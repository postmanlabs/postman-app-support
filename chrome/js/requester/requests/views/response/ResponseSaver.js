var ResponseSaver = Backbone.View.extend({
    initialize: function() {
    	var model = this.model;
    	var view = this;

    	console.log("ResponseSaver initialized", this.model);
    	$("#response-sample-save-start").on("click", function() {
    		view.showSaveForm();
    	});

	    $("#response-sample-save").on("click", function() {
	    	view.saveResponse();
	    });

	    $("#response-sample-save").on("click", function() {
	    	view.cancelSaveResponse();
	    });
    },

    showSaveForm: function() {
		$("#response-sample-save-start").css("display", "none");
		$("#response-sample-save-form").css("display", "block");
    },

    hideSaveForm: function() {
    	$("#response-sample-save-start").css("display", "block");
    	$("#response-sample-save-form").css("display", "none");
    },

    saveResponse: function() {
    	this.hideSaveForm();

    	var name = $("#response-sample-name").val();
    	console.log("Save this response", name);

    	var response = this.model.get("response");
    	response.saveAsSample(name);
    },

    cancelSaveResponse: function() {
    	this.hideSaveForm();
    }
});