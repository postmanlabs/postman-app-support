var ResponseViewer = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var responseModel = model.get("response");
        var view = this;

        this.responseBodyViewer = new ResponseBodyViewer({model: this.model});
        this.responseHeaderViewer = new ResponseHeaderViewer({model: this.model});
        this.responseCookieViewer = new ResponseCookieViewer({model: this.model});
        this.responseMetaViewer = new ResponseMetaViewer({model: this.model});

        responseModel.on("failedRequest", this.onFailedRequest, this);
        responseModel.on("loadResponse", this.load, this);

        $('#response-body-toggle').on("click", function () {
            view.responseBodyViewer.toggleBodySize();
        });

        $('#response-body-line-wrapping').on("click", function () {
            view.responseBodyViewer.toggleLineWrapping();
            return true;
        });

        $('#response-formatting').on("click", "a", function () {
            var previewType = $(this).attr('data-type');
            view.responseBodyViewer.changePreviewType(previewType);
        });

        $('#response-language').on("click", "a", function () {
            var language = $(this).attr("data-mode");
            view.responseBodyViewer.setMode(language);
        });

        $('#response-data').on("mousedown", ".cm-link", function () {
            var link = $(this).html();
            var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
            model.loadRequestFromLink(link, headers);
        });

        $('.response-tabs').on("click", "li", function () {
            var section = $(this).attr('data-section');
            if (section === "body") {
                view.showBody();
            }
            else if (section === "headers") {
                view.showHeaders();
            }
            else if (section === "cookies") {
                view.showCookies();
            }
        });
    },

    onFailedRequest: function(errorUrl) {
        $('#connection-error-url').html("<a href='" + errorUrl + "' target='_blank'>" + errorUrl + "</a>");
        this.showScreen("failed");
    },

    load:function () {
        var model = this.model;
        var request = model;
        var response = model.get("response");
        var headers = response.get("headers");
        var time = response.get("time");

        var previewType = response.get("previewType");
        var language = response.get("language");
        var responseRawDataType = response.get("rawDataType");
        var responseData = response.get("responseData");
        var text = response.get("text");

        var presetPreviewType = pm.settings.getSetting("previewType");

        $("#response-sample-status").css("display", "none");                    
        
        this.showScreen("success");
        this.showBody();
        
        $('#response-status').html(Handlebars.templates.item_response_code(response.get("responseCode")));
        $('.response-code').popover({
            trigger: "hover"
        });
        
        $('.response-tabs li[data-section="headers"]').html("Headers (" + headers.length + ")");
        $("#response-data").css("display", "block");

        $("#loader").css("display", "none");

        $('#response-time .data').html(time + " ms");
        
        $('#response').css("display", "block");
        $('#submit-request').button("reset");
        $('#code-data').css("display", "block");

        $('#response-headers').html("");
        $("#response-headers").append(Handlebars.templates.response_headers({"items":headers}));
        $('.response-header-name').popover({
            trigger: "hover",
        });

                
        // TODO This moves to the view
        $('#language').val(language);

        // TODO This needs to be moved to the view
        // TODO Some part of this would be present in the request
        if (previewType === "image") {
            $('#response-as-code').css("display", "none");
            $('#response-as-text').css("display", "none");
            $('#response-as-image').css("display", "block");

            var imgLink = request.get("url");

            $('#response-formatting').css("display", "none");
            $('#response-actions').css("display", "none");
            $("#response-language").css("display", "none");
            $("#response-as-preview").css("display", "none");
            $("#response-copy-container").css("display", "none");
            $("#response-pretty-modifiers").css("display", "none");

            var remoteImage = new RAL.RemoteImage({
                priority: 0,
                src: imgLink,
                headers: request.getXhrHeaders()
            });

            remoteImage.addEventListener('loaded', function(remoteImage) {
            });

            $("#response-as-image").html("");
            var container = document.querySelector('#response-as-image');
            container.appendChild(remoteImage.element);

            RAL.Queue.add(remoteImage);
            RAL.Queue.setMaxConnections(4);
            RAL.Queue.start();
        }
        // TODO Some part of this would be moved to the request
        else if (previewType === "pdf" && responseRawDataType === "arraybuffer") {                
            // Hide everything else
            $('#response-as-code').css("display", "none");
            $('#response-as-text').css("display", "none");
            $('#response-as-image').css("display", "none");
            $('#response-formatting').css("display", "none");
            $('#response-actions').css("display", "none");
            $("#response-language").css("display", "none");
            $("#response-copy-container").css("display", "none");

            $("#response-as-preview").html("");
            $("#response-as-preview").css("display", "block");
            $("#response-pretty-modifiers").css("display", "none");

            pm.filesystem.renderResponsePreview("response.pdf", responseData, "pdf", function (response_url) {
                $("#response-as-preview").html("<iframe src='" + response_url + "'/>");
            });

        }
        // TODO This needs to be triggered through an event
        else if (previewType === "pdf" && responseRawDataType === "text") {
            
        }
        else {
            this.responseBodyViewer.setFormat(language, text, presetPreviewType, true);
        }        
        
        if (previewType === "html") {
            $("#response-as-preview").html("");
            var cleanResponseText = this.stripScriptTag(text);
            pm.filesystem.renderResponsePreview("response.html", cleanResponseText, "html", function (response_url) {
                $("#response-as-preview").html("<iframe></iframe>");
                $("#response-as-preview iframe").attr("src", response_url);
            });
        }
        
        if (request.get("method") === "HEAD") {
            this.showHeaders()
        }

        if (request.get("isFromCollection") === true) {
            $("#response-collection-request-actions").css("display", "block");
        }
        else {
            $("#response-collection-request-actions").css("display", "none");
        }
        
    },

    // TODO Move this to the model
    clear:function () {
        pm.request.response.startTime = 0;
        pm.request.response.endTime = 0;
        pm.request.response.totalTime = 0;
        pm.request.response.status = "";
        pm.request.response.time = 0;
        pm.request.response.headers = {};
        pm.request.response.mime = "";
        pm.request.response.state.size = "normal";
        pm.request.response.previewType = "parsed";

        // TODO This can be triggered as an event
        $('#response').css("display", "none");
    },

    showHeaders:function () {
        $('.response-tabs li').removeClass("active");
        $('.response-tabs li[data-section="headers"]').addClass("active");
        $('#response-data-container').css("display", "none");
        $('#response-headers-container').css("display", "block");
        $('#response-cookies-container').css("display", "none");
    },

    showBody:function () {
        $('.response-tabs li').removeClass("active");
        $('.response-tabs li[data-section="body"]').addClass("active");
        $('#response-data-container').css("display", "block");
        $('#response-headers-container').css("display", "none");
        $('#response-cookies-container').css("display", "none");
    },

    showCookies:function () {
        $('.response-tabs li').removeClass("active");
        $('.response-tabs li[data-section="cookies"]').addClass("active");
        $('#response-data-container').css("display", "none");
        $('#response-headers-container').css("display", "none");
        $('#response-cookies-container').css("display", "block");
    },

    showScreen:function (screen) {
        $("#response").css("display", "block");
        var active_id = "#response-" + screen + "-container";
        var all_ids = ["#response-waiting-container",
            "#response-failed-container",
            "#response-success-container"];
        for (var i = 0; i < 3; i++) {
            $(all_ids[i]).css("display", "none");
        }

        $(active_id).css("display", "block");
    },    

    // TODO This should go into the model
    setMode:function (mode) {
        var text = pm.request.response.text;
        pm.request.response.setFormat(mode, text, pm.settings.getSetting("previewType"), true);
    },

    // TODO This should go into the model
    stripScriptTag:function (text) {
        var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
        text = text.replace(re, "");
        return text;
    }
});