var ResponseViewer = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var responseModel = model.get("response");
        var view = this;

        this.responseBodyViewer = new ResponseBodyViewer({model: this.model});
        this.responseHeaderViewer = new ResponseHeaderViewer({model: this.model});
        this.responseCookieViewer = new ResponseCookieViewer({model: this.model});
        this.responseMetaViewer = new ResponseMetaViewer({model: this.model});
        this.responseSaver = new ResponseSaver({model: this.model});

        responseModel.on("failedRequest", this.onFailedRequest, this);
        responseModel.on("clearResponse", this.clear, this);
        responseModel.on("sentRequest", this.onSentRequest, this);
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

            pm.settings.setSetting("responsePreviewDataSection", section);

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


        $(document).bind('keydown', 'f', function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            view.responseBodyViewer.toggleBodySize();
        });
    },

    onSentRequest: function() {
        this.showScreen("waiting");
    },

    onFailedRequest: function(errorUrl) {
        $('#connection-error-url').html("<a href='" + errorUrl + "' target='_blank'>" + errorUrl + "</a>");
        this.showScreen("failed");
    },

    clear: function() {
        $('#response').css("display", "none");
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
        var method = request.get("method");
        var action = model.get("action");
        var presetPreviewType = pm.settings.getSetting("previewType");

        var activeSection = pm.settings.getSetting("responsePreviewDataSection");

        this.showScreen("success");

        $('#response').css("display", "block");
        $("#response-data").css("display", "block");

        if (action === "download") {
            this.showHeaders();
        }
        else {
            if (method === "HEAD") {
                this.showHeaders();
            }
            else {
                if (activeSection === "body") {
                    this.showBody();
                }
                else if (activeSection === "headers") {
                    this.showHeaders();
                }
                else {
                    this.showBody();
                }
            }
        }

        if (request.get("isFromCollection") === true) {
            $("#response-collection-request-actions").css("display", "block");
        }
        else {
            $("#response-collection-request-actions").css("display", "none");
        }

        response.trigger("finishedLoadResponse");
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
    }
});