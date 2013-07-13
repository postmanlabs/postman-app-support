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
            view.toggleBodySize();
        });

        $('#response-body-line-wrapping').on("click", function () {
            view.toggleLineWrapping();
            return true;
        });

        $('#response-formatting').on("click", "a", function () {
            var previewType = $(this).attr('data-type');
            view.changePreviewType(previewType);
        });

        $('#response-language').on("click", "a", function () {
            var language = $(this).attr("data-mode");
            view.setMode(language);
        });

        $('#response-sample-save-start').on("click", function () {
            $('#response-sample-save-start-container').css("display", "none");
            $('#response-sample-save-form').css("display", "inline-block");
        });

        $('#response-sample-cancel').on("click", function () {
            $('#response-sample-save-start-container').css("display", "inline-block");
            $('#response-sample-save-form').css("display", "none");
        });

        $('#response-sample-save').on("click", function () {
            var url = $('#url').val();

            var currentResponse = pm.request.response;
            var request = new CollectionRequest();
            request.id = guid();
            request.headers = pm.request.getPackedHeaders();
            request.url = url;
            request.method = pm.request.method;
            request.data = pm.request.body.getData();
            request.dataMode = pm.request.dataMode;
            request.time = new Date().getTime();

            var name = $("#response-sample-name").val();

            var response = {
                "id":guid(),
                "name":name,
                "collectionRequestId":pm.request.collectionRequestId,
                "request":request,
                "responseCode":currentResponse.responseCode,
                "time":currentResponse.time,
                "headers":currentResponse.headers,
                "cookies":currentResponse.cookies,
                "text":currentResponse.text
            };

            pm.collections.saveResponseAsSample(response);

            $('#response-sample-save-start-container').css("display", "inline-block");
            $('#response-sample-save-form').css("display", "none");
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
        var response = model.get("response");
        var headers = response.get("headers");
        var time = response.get("time");

        var previewType = response.get("previewType");
        var language = response.get("language");
        var responseRawDataType = response.get("rawDataType");

        $("#response-sample-status").css("display", "none");                    
        
        this.showScreen("success")
        this.showBody();
        
        $('#response-status').html(Handlebars.templates.item_response_code(response.get("responseCode"));
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
            this.setFormat(language, pm.request.response.text, pm.settings.getSetting("previewType"), true);
        }        
        
        if (previewType === "html") {
            $("#response-as-preview").html("");
            var cleanResponseText = this.stripScriptTag(response.get("text"));
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

var ResponseBodyViewer = Backbone.View.extend({
    initialize: function() {
        this.responseBodyPrettyViewer = new ResponseBodyPrettyViewer({model: this.model});
        this.responseBodyRawViewer = new ResponseBodyRawViewer({model: this.model});        
        this.responseBodyImageViewer = new ResponseBodyImageViewer({model: this.model});
        this.responseBodyIframeViewer = new ResponseBodyIframeViewer({model: this.model});
        this.responseBodyPDFViewer = new responseBodyPDFViewer({model: this.model});
    },

    setFormat:function (language, response, format, forceCreate) {
        //Keep CodeMirror div visible otherwise the response gets cut off
        $("#response-copy-container").css("display", "block");
        $('#response-as-code').css("display", "block");
        $('#response-as-text').css("display", "none");

        $('#response-as-image').css("display", "none");
        $('#response-formatting').css("display", "block");
        $('#response-actions').css("display", "block");

        $('#response-formatting a').removeClass('active');
        $('#response-formatting a[data-type="' + format + '"]').addClass('active');
        $('#code-data').css("display", "none");
        $('#code-data').attr("data-mime", language);

        var codeDataArea = document.getElementById("code-data");
        var foldFunc;
        var mode;

        $('#response-language').css("display", "block");
        $('#response-language a').removeClass("active");

        //Use prettyprint here instead of stringify
        if (language === 'javascript') {
            try {
                if ('string' ===  typeof response && response.match(/^[\)\]\}]/)) {
                    response = response.substring(response.indexOf('\n'));
                }

                response = vkbeautify.json(response);
                mode = 'javascript';
                foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
            }
            catch (e) {
                mode = 'text';
            }
            $('#response-language a[data-mode="javascript"]').addClass("active");

        }
        else if (language === 'html') {
            response = vkbeautify.xml(response);
            mode = 'xml';
            foldFunc = CodeMirror.newFoldFunction(CodeMirror.tagRangeFinder);
            $('#response-language a[data-mode="html"]').addClass("active");
        }
        else {
            mode = 'text';
        }

        var lineWrapping;
        if (pm.settings.getSetting("lineWrapping") === true) {
            $('#response-body-line-wrapping').addClass("active");
            lineWrapping = true;
        }
        else {
            $('#response-body-line-wrapping').removeClass("active");
            lineWrapping = false;
        }

        pm.editor.mode = mode;
        var renderMode = mode;
        if ($.inArray(mode, ["javascript", "xml", "html"]) >= 0) {
            renderMode = "links";
        }

        if (!pm.editor.codeMirror || forceCreate) {
            $('#response .CodeMirror').remove();
            pm.editor.codeMirror = CodeMirror.fromTextArea(codeDataArea,
            {
                mode:renderMode,
                lineNumbers:true,
                fixedGutter:true,
                onGutterClick:foldFunc,
                theme:'eclipse',
                lineWrapping:lineWrapping,
                readOnly:true
            });

            var cm = pm.editor.codeMirror;
            cm.setValue(response);
        }
        else {
            pm.editor.codeMirror.setOption("onGutterClick", foldFunc);
            pm.editor.codeMirror.setOption("mode", renderMode);
            pm.editor.codeMirror.setOption("lineWrapping", lineWrapping);
            pm.editor.codeMirror.setOption("theme", "eclipse");
            pm.editor.codeMirror.setOption("readOnly", false);
            pm.editor.codeMirror.setValue(response);
            pm.editor.codeMirror.refresh();

            CodeMirror.commands["goDocStart"](pm.editor.codeMirror);
            $(window).scrollTop(0);
        }

        //If the format is raw then switch
        if (format === "parsed") {
            $('#response-as-code').css("display", "block");
            $('#response-as-text').css("display", "none");
            $('#response-as-preview').css("display", "none");
            $('#response-pretty-modifiers').css("display", "block");
        }
        else if (format === "raw") {
            $('#code-data-raw').val(response);
            var codeDataWidth = $(document).width() - $('#sidebar').width() - 60;
            $('#code-data-raw').css("width", codeDataWidth + "px");
            $('#code-data-raw').css("height", "600px");
            $('#response-as-code').css("display", "none");
            $('#response-as-text').css("display", "block");
            $('#response-pretty-modifiers').css("display", "none");
        }
        else if (format === "preview") {
            $('#response-as-code').css("display", "none");
            $('#response-as-text').css("display", "none");
            $('#response-as-preview').css("display", "block");
            $('#response-pretty-modifiers').css("display", "none");
        }
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

    loadImage: function(url) {
        var remoteImage = new RAL.RemoteImage({
            priority: 0,
            src: imgLink,
            headers: pm.request.getXhrHeaders()
        });

        remoteImage.addEventListener('loaded', function(remoteImage) {
        });

        $("#response-as-image").html("");
        var container = document.querySelector('#response-as-image');
        container.appendChild(remoteImage.element);

        RAL.Queue.add(remoteImage);
        RAL.Queue.setMaxConnections(4);
        RAL.Queue.start();
    },

    changePreviewType:function (newType) {
        if (pm.request.response.previewType === newType) {
            return;
        }

        pm.request.response.previewType = newType;
        $('#response-formatting a').removeClass('active');
        $('#response-formatting a[data-type="' + pm.request.response.previewType + '"]').addClass('active');

        pm.settings.setSetting("previewType", newType);

        if (newType === 'raw') {
            $('#response-as-text').css("display", "block");
            $('#response-as-code').css("display", "none");
            $('#response-as-preview').css("display", "none");
            $('#code-data-raw').val(pm.request.response.text);
            var codeDataWidth = $(document).width() - $('#sidebar').width() - 60;
            $('#code-data-raw').css("width", codeDataWidth + "px");
            $('#code-data-raw').css("height", "600px");
            $('#response-pretty-modifiers').css("display", "none");
        }
        else if (newType === 'parsed') {
            $('#response-as-text').css("display", "none");
            $('#response-as-code').css("display", "block");
            $('#response-as-preview').css("display", "none");
            $('#code-data').css("display", "none");
            $('#response-pretty-modifiers').css("display", "block");
            pm.editor.codeMirror.refresh();
        }
        else if (newType === 'preview') {
            $('#response-as-text').css("display", "none");
            $('#response-as-code').css("display", "none");
            $('#code-data').css("display", "none");
            $('#response-as-preview').css("display", "block");
            $('#response-pretty-modifiers').css("display", "none");
        }
    },

    toggleBodySize:function () {
        if ($('#response').css("display") === "none") {
            return false;
        }

        $('a[rel="tooltip"]').tooltip('hide');
        if (pm.request.response.state.size === "normal") {
            pm.request.response.state.size = "maximized";
            $('#response-body-toggle img').attr("src", "img/full-screen-exit-alt-2.png");
            pm.request.response.state.width = $('#response-data').width();
            pm.request.response.state.height = $('#response-data').height();
            pm.request.response.state.display = $('#response-data').css("display");
            pm.request.response.state.position = $('#response-data').css("position");

            $('#response-data').css("position", "absolute");
            $('#response-data').css("left", 0);
            $('#response-data').css("top", "-15px");
            $('#response-data').css("width", $(document).width() - 20);
            $('#response-data').css("height", $(document).height());
            $('#response-data').css("z-index", 100);
            $('#response-data').css("background-color", "#fff");
            $('#response-data').css("padding", "10px");
        }
        else {
            pm.request.response.state.size = "normal";
            $('#response-body-toggle img').attr("src", "img/full-screen-alt-4.png");
            $('#response-data').css("position", pm.request.response.state.position);
            $('#response-data').css("left", 0);
            $('#response-data').css("top", 0);
            $('#response-data').css("width", pm.request.response.state.width);
            $('#response-data').css("height", pm.request.response.state.height);
            $('#response-data').css("z-index", 10);
            $('#response-data').css("background-color", "#fff");
            $('#response-data').css("padding", "0px");
        }
    },
});

var ResponseBodyPrettyViewer = Backbone.View.extend({
    initialize: function() {

    }
});

var ResponseBodyRawViewer = Backbone.View.extend({
    initialize: function() {

    }
});

var ResponseBodyImageViewer = Backbone.View.extend({
    initialize: function() {

    }
});

var ResponseBodyPDFViewer = Backbone.View.extend({
    initialize: function() {

    }
});

var ResponseBodyIframeViewer = Backbone.View.extend({
    initialize: function() {

    }
});

var ResponseCookieViewer = Backbone.View.extend({
    initialize: function() {

    },

    renderCookies:function (cookies) {
        var count = 0;
        if (!cookies) {
            count = 0;
        }
        else {
            count = cookies.length;
        }

        if (count === 0) {
            $("#response-tabs-cookies").html("Cookies");
            $('#response-tabs-cookies').css("display", "none");
        }
        else {
            $("#response-tabs-cookies").html("Cookies (" + count + ")");
            $('#response-tabs-cookies').css("display", "block");
            cookies = _.sortBy(cookies, function (cookie) {
                return cookie.name;
            });

            for (var i = 0; i < count; i++) {
                var cookie = cookies[i];
                cookie.name = limitStringLineWidth(cookie.name, 20);
                cookie.value = limitStringLineWidth(cookie.value, 20);
                cookie.path = limitStringLineWidth(cookie.path, 20);
                if ("expirationDate" in cookie) {
                    var date = new Date(cookie.expirationDate * 1000);
                    cookies[i].expires = date.toLocaleString();
                }
            }

            $('#response-cookies-items').html(Handlebars.templates.response_cookies({"items":cookies}));
        }

        pm.request.response.cookies = cookies;
    },

    loadCookies:function (url) {
        /* TODO: Not available in Chrome packaged apps
        chrome.cookies.getAll({url:url}, function (cookies) {
            var count;
            pm.request.response.renderCookies(cookies);
        });
        */
    },
});

var ResponseHeaderViewer = Backbone.View.extend({
    initialize: function() {

    },

    loadHeaders:function (data) {
        // TODO Set this in the model
        pm.request.response.headers = pm.request.unpackResponseHeaders(data);

        if(pm.settings.getSetting("usePostmanProxy") === true) {
            var count = pm.request.response.headers.length;
            for(var i = 0; i < count; i++) {
                if(pm.request.response.headers[i].key === "Postman-Location") {
                    pm.request.response.headers[i].key = "Location";
                    pm.request.response.headers[i].name = "Location";
                    break;
                }
            }
        }

        $('#response-headers').html("");

        // TODO Set this in the model
        pm.request.response.headers = _.sortBy(pm.request.response.headers, function (header) {
            return header.name;
        });


        $("#response-headers").append(Handlebars.templates.response_headers({"items":pm.request.response.headers}));
        $('.response-header-name').popover({
            trigger: "hover",
        });
    },
});

var ResponseMetaViewer = Backbone.View.extend({
    initialize: function() {
    }
});