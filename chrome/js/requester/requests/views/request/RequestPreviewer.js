var RequestPreviewer = Backbone.View.extend({
    initialize: function() {
    	var model = this.model;
    	var view = this;

        $(".request-preview-header-limitations").dropdown();

        pm.mediator.on("showPreview", this.showPreview, this);

        $("#request-preview-header .request-helper-tabs li").on("click", function () {
            $("#request-preview-header .request-helper-tabs li").removeClass("active");
            $(event.currentTarget).addClass("active");
            var type = $(event.currentTarget).attr('data-id');
            view.showPreviewType(type);
        });
    },

    showPreview: function() {
    	this.model.generatePreview();
    	this.render();
    },

    showPreviewType: function(type) {
    	$("#request-preview-content div").css("display", "none");
    	$("#request-preview-content-" + type).css("display", "block");
    },

    render: function() {
        this.model.set("editorMode", 1);

        var previewHtml = this.model.get("previewHtml");
        var curlHtml = this.model.get("curlHtml");

        $("#request-preview-content-http-request").html(previewHtml);
        $("#request-preview-content-curl").html(curlHtml);
        $("#preview-request").html("Build");
        $("#request-builder").css("display", "none");
        $("#request-preview").css("display", "block");
    }
});