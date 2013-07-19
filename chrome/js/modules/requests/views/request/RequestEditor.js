var RequestEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var responseModel = model.get("response");
        var view = this;
        var body = model.get("body");

        this.requestMethodEditor = new RequestMethodEditor({model: this.model});
        this.requestHeaderEditor = new RequestHeaderEditor({model: this.model});
        this.requestURLEditor = new RequestURLEditor({model: this.model});
        this.requestBodyEditor = new RequestBodyEditor({model: this.model});
        this.requestClipboard = new RequestClipboard({model: this.model});
        this.requestPreviewer = new RequestPreviewer({model: this.model});

        model.on("loadRequest", this.onLoadRequest, this);
        model.on("sentRequest", this.onSentRequest, this);        
        model.on("startNew", this.onStartNew, this);

        responseModel.on("failedRequest", this.onFailedRequest, this);
        responseModel.on("finishedLoadResponse", this.onFinishedLoadResponse, this);

        this.on("send", this.onSend, this);
        this.on("preview", this.onPreview, this);

        $("#update-request-in-collection").on("click", function () {
            console.log("Update request in model");

            //TODO Should trigger request to update body model
            view.requestHeaderEditor.updateModel();
            view.requestURLEditor.updateModel();
            view.requestBodyEditor.updateModel();

            var current = model.getAsObject();
            var collectionRequest = {
                id: model.get("collectionRequestId"),
                url: current.url,
                data: current.data,
                headers: current.headers,
                dataMode: current.dataMode,
                method: current.method,
                version: current.version,
                time: new Date().getTime()
            };            

            console.log("Request is", collectionRequest);

            pm.collections.updateCollectionRequest(collectionRequest);
        });

        $("#cancel-request").on("click", function () {
            model.trigger("cancelRequest", model);
        });

        $("#request-actions-reset").on("click", function () {
            model.trigger("startNew", model);
        });

        $('#add-to-collection').on("click", function () {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }
        });

        $("#submit-request").on("click", function () {
            view.trigger("send", view);
        });

        $("#preview-request").on("click", function () {
            _.bind(view.onPreviewRequestClick, view)();
        });


        $('body').on('keydown', 'input', function (event) {
            if(pm.layout.isModalOpen) {
                return;
            }

            if (event.keyCode === 27) {
                $(event.target).blur();
            }
            else if (event.keyCode === 13) {
                view.trigger("send", view);
            }

            return true;
        });


        $(document).bind('keydown', 'return', function () {
            if(pm.layout.isModalOpen) {
                return;
            }

            console.log("Triggering send");

            view.trigger("send", view);
            return false;
        });

        model.trigger("readyToLoadRequest", this);
    },

    onStartNew: function() {
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
        $('#update-request-in-collection').css("display", "none");
    },

    onSend: function() {
        this.requestHeaderEditor.updateModel();
        this.requestURLEditor.updateModel();
        this.requestBodyEditor.updateModel();

        this.model.trigger("send", "text");
    },

    onPreview: function() {
        this.requestHeaderEditor.updateModel();
        this.requestURLEditor.updateModel();        
        this.requestBodyEditor.updateModel();

        this.model.generatePreview();

        this.showPreview();
    },

    onSentRequest: function() {
        console.log("Set button as loading");
        $('#submit-request').button("loading");
    },

    onFailedRequest: function() {
        $('#submit-request').button("reset");
    },

    onFinishedLoadResponse: function() {
        $('#submit-request').button("reset");
    },

    onLoadRequest: function(m) {
        var model = this.model;
        var body = model.get("body");
        var method = model.get("method");
        var isMethodWithBody = model.isMethodWithBody(method);
        var url = model.get("url");
        var headers = model.get("headers");
        var data = model.get("data");
        var name = model.get("name");
        var description = model.get("description");
        var responses = model.get("responses");
        var isFromSample = model.get("isFromSample");
        var isFromCollection = model.get("isFromCollection");

        if (isFromCollection) {
            $('#update-request-in-collection').css("display", "inline-block");

            if (typeof name !== "undefined") {
                $('#request-meta').css("display", "block");
                $('#request-name').html(name);
                $('#request-name').css("display", "inline-block");
            }
            else {
                $('#request-meta').css("display", "none");
                $('#request-name').css("display", "none");
            }

            if (typeof description !== "undefined") {
                $('#request-description').html(description);
                $('#request-description').css("display", "block");
            }
            else {
                $('#request-description').css("display", "none");
            }

            $('#response-sample-save-form').css("display", "none");

            $('.request-meta-actions-togglesize').attr('data-action', 'minimize');
            $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');
        }
        else if (isFromSample) {
            $('#update-request-in-collection').css("display", "inline-block");
        }
        else {
            $('#request-meta').css("display", "none");
            $('#update-request-in-collection').css("display", "none");
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);

        $('#url').val(url);

        var newUrlParams = getUrlVars(url, false);

        //@todoSet params using keyvalueeditor function
        $('#url-keyvaleditor').keyvalueeditor('reset', newUrlParams);
        $('#headers-keyvaleditor').keyvalueeditor('reset', headers);

        $('#request-method-selector').val(method);

        if (isMethodWithBody) {
            $('#data').css("display", "block");
        }
        else {
            $('#data').css("display", "none");
        }

        console.log("Should load body data at this point");
    },

    showRequestBuilder: function() {
        $("#preview-request").html("Preview");
        this.model.set("editorMode", 0);
        $("#request-builder").css("display", "block");
        $("#request-preview").css("display", "none");
    },

    // TODO Implement this using events
    showPreview: function() {
        this.model.set("editorMode", 1);

        var previewHtml = this.model.get("previewHtml");

        $("#request-preview-content").html(previewHtml);
        $("#preview-request").html("Build");        
        $("#request-builder").css("display", "none");
        $("#request-preview").css("display", "block");
    },

    onPreviewRequestClick: function(event) {
        var editorMode = this.model.get("editorMode");
        if(editorMode === 1) {
            this.showRequestBuilder();
        }
        else {            
            this.trigger("preview", this);            
        }
    },
});