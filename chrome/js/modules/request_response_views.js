var ResponseViewer = Backbone.View.extend({
    initialize: function() {
        $('#response-body-toggle').on("click", function () {
            pm.request.response.toggleBodySize();
        });

        $('#response-body-line-wrapping').on("click", function () {
            pm.editor.toggleLineWrapping();
            return true;
        });

        $('#response-open-in-new-window').on("click", function () {
            var data = pm.request.response.text;
            pm.request.response.openInNewWindow(data);
        });


        $('#response-formatting').on("click", "a", function () {
            var previewType = $(this).attr('data-type');
            pm.request.response.changePreviewType(previewType);
        });

        $('#response-language').on("click", "a", function () {
            var language = $(this).attr("data-mode");
            pm.request.response.setMode(language);
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
            pm.request.loadRequestFromLink(link, headers);
        });

        $('.response-tabs').on("click", "li", function () {
            var section = $(this).attr('data-section');
            if (section === "body") {
                pm.request.response.showBody();
            }
            else if (section === "headers") {
                pm.request.response.showHeaders();
            }
            else if (section === "cookies") {
                pm.request.response.showCookies();
            }
        });
    },

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

    //Needs to be updated
    render:function (response) {
        pm.request.response.showScreen("success");
        $('#response-status').html(Handlebars.templates.item_response_code(response.responseCode));
        $('.response-code').popover({
            trigger: "hover"
        });

        //This sets pm.request.response.headers
        $("#response-headers").append(Handlebars.templates.response_headers({"items":response.headers}));

        $('.response-tabs li[data-section="headers"]').html("Headers (" + response.headers.length + ")");
        $("#response-data").css("display", "block");

        $("#loader").css("display", "none");

        $('#response-time .data').html(response.time + " ms");

        var contentTypeIndexOf = find(response.headers, function (element, index, collection) {
            return element.key === "Content-Type";
        });

        var contentType;
        if (contentTypeIndexOf >= 0) {
            contentType = response.headers[contentTypeIndexOf].value;
        }

        $('#response').css("display", "block");
        $('#submit-request').button("reset");
        $('#code-data').css("display", "block");

        var language = 'html';

        pm.request.response.previewType = pm.settings.getSetting("previewType");

        var responsePreviewType = 'html';

        if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
            if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1 || pm.settings.getSetting("languageDetection") === 'javascript') {
                language = 'javascript';
            }

            $('#language').val(language);

            if (contentType.search(/image/i) >= 0) {
                responsePreviewType = 'image';

                $('#response-as-code').css("display", "none");
                $('#response-as-text').css("display", "none");
                $('#response-as-image').css("display", "block");

                var imgLink = pm.request.processUrl($('#url').val());

                $('#response-formatting').css("display", "none");
                $('#response-actions').css("display", "none");
                $("#response-language").css("display", "none");
                $("#response-as-preview").css("display", "none");
                $("#response-pretty-modifiers").css("display", "none");
                $("#response-as-image").html("<img src='" + imgLink + "'/>");

                //TODO: Needs to be updated
            }
            else {
                responsePreviewType = 'html';
                pm.request.response.setFormat(language, response.text, pm.settings.getSetting("previewType"), true);
            }
        }
        else {
            if (pm.settings.getSetting("languageDetection") === 'javascript') {
                language = 'javascript';
            }
            pm.request.response.setFormat(language, response.text, pm.settings.getSetting("previewType"), true);
        }

        pm.request.response.renderCookies(response.cookies);
        if (responsePreviewType === "html") {
            $("#response-as-preview").html("");

            var cleanResponseText = pm.request.response.stripScriptTag(pm.request.response.text);
            pm.filesystem.renderResponsePreview("response.html", cleanResponseText, "html", function (response_url) {
                $("#response-as-preview").html("<iframe></iframe>");
                $("#response-as-preview iframe").attr("src", response_url);
            });
        }

        if (pm.request.method === "HEAD") {
            pm.request.response.showHeaders()
        }

        if (pm.request.isFromCollection === true) {
            $("#response-collection-request-actions").css("display", "block");
        }
        else {
            $("#response-collection-request-actions").css("display", "none");
        }

        $("#response-sample-status").css("display", "block");

        var r = pm.request.response;
        r.time = response.time;
        r.cookies = response.cookies;
        r.headers = response.headers;
        r.text = response.text;
        r.responseCode = response.responseCode;

        $("#response-samples").css("display", "block");
    },

    load:function (response) {
        $("#response-sample-status").css("display", "none");
        if (response.readyState === 4) {
            //Something went wrong
            if (response.status === 0) {
                var errorUrl = pm.envManager.getCurrentValue(pm.request.url);
                $('#connection-error-url').html("<a href='" + errorUrl + "' target='_blank'>" + errorUrl + "</a>");
                pm.request.response.showScreen("failed");
                $('#submit-request').button("reset");
                return false;
            }

            pm.request.response.showScreen("success")
            pm.request.response.showBody();

            var responseCodeName;
            var responseCodeDetail;

            if ("statusText" in response) {
                responseCodeName = response.statusText;
                responseCodeDetail = "";

                if (response.status in httpStatusCodes) {
                    responseCodeDetail = httpStatusCodes[response.status]['detail'];
                }
            }
            else {
                if (response.status in httpStatusCodes) {
                    responseCodeName = httpStatusCodes[response.status]['name'];
                    responseCodeDetail = httpStatusCodes[response.status]['detail'];
                }
                else {
                    responseCodeName = "";
                    responseCodeDetail = "";
                }
            }

            var responseCode = {
                'code':response.status,
                'name':responseCodeName,
                'detail':responseCodeDetail
            };

            var responseData;
            if (response.responseRawDataType === "arraybuffer") {
                responseData = response.response;
            }
            else {
                pm.request.response.text = response.responseText;
            }

            pm.request.endTime = new Date().getTime();

            var diff = pm.request.getTotalTime();

            pm.request.response.time = diff;
            pm.request.response.responseCode = responseCode;

            $('#response-status').html(Handlebars.templates.item_response_code(responseCode));
            $('.response-code').popover({
                trigger: "hover"
            });

            //This sets pm.request.response.headers
            pm.request.response.loadHeaders(response.getAllResponseHeaders());

            $('.response-tabs li[data-section="headers"]').html("Headers (" + pm.request.response.headers.length + ")");
            $("#response-data").css("display", "block");

            $("#loader").css("display", "none");

            $('#response-time .data').html(diff + " ms");

            var contentType = response.getResponseHeader("Content-Type");

            $('#response').css("display", "block");
            $('#submit-request').button("reset");
            $('#code-data').css("display", "block");

            var language = 'html';

            pm.request.response.previewType = pm.settings.getSetting("previewType");

            var responsePreviewType = 'html';

            if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
                if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1 || pm.settings.getSetting("languageDetection") === 'javascript') {
                    language = 'javascript';
                }

                $('#language').val(language);

                if (contentType.search(/image/i) >= 0) {
                    responsePreviewType = 'image';

                    $('#response-as-code').css("display", "none");
                    $('#response-as-text').css("display", "none");
                    $('#response-as-image').css("display", "block");
                    var imgLink = pm.request.processUrl($('#url').val());

                    $('#response-formatting').css("display", "none");
                    $('#response-actions').css("display", "none");
                    $("#response-language").css("display", "none");
                    $("#response-as-preview").css("display", "none");
                    $("#response-copy-container").css("display", "none");
                    $("#response-pretty-modifiers").css("display", "none");

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
                }
                else if (contentType.search(/pdf/i) >= 0 && response.responseRawDataType === "arraybuffer") {
                    responsePreviewType = 'pdf';

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
                else if (contentType.search(/pdf/i) >= 0 && response.responseRawDataType === "text") {
                    pm.request.send("arraybuffer");
                    return;
                }
                else {
                    responsePreviewType = 'html';
                    pm.request.response.setFormat(language, pm.request.response.text, pm.settings.getSetting("previewType"), true);
                }
            }
            else {
                if (pm.settings.getSetting("languageDetection") === 'javascript') {
                    language = 'javascript';
                }
                pm.request.response.setFormat(language, pm.request.response.text, pm.settings.getSetting("previewType"), true);
            }

            var url = pm.request.url;

            //Sets pm.request.response.cookies
            pm.request.response.loadCookies(url);

            if (responsePreviewType === "html") {
                $("#response-as-preview").html("");
                var cleanResponseText = pm.request.response.stripScriptTag(pm.request.response.text);
                pm.filesystem.renderResponsePreview("response.html", cleanResponseText, "html", function (response_url) {
                    $("#response-as-preview").html("<iframe></iframe>");
                    $("#response-as-preview iframe").attr("src", response_url);
                });
            }

            if (pm.request.method === "HEAD") {
                pm.request.response.showHeaders()
            }

            if (pm.request.isFromCollection === true) {
                $("#response-collection-request-actions").css("display", "block");
            }
            else {
                $("#response-collection-request-actions").css("display", "none");
            }
        }

        pm.layout.setLayout();
        return true;
    },

    openInNewWindow:function (data) {
        var name = "response.html";
        var type = "text/html";
        pm.filesystem.saveAndOpenFile(name, data, type, function () {
        });
    },

    setMode:function (mode) {
        var text = pm.request.response.text;
        pm.request.response.setFormat(mode, text, pm.settings.getSetting("previewType"), true);
    },

    stripScriptTag:function (text) {
        var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
        text = text.replace(re, "");
        return text;
    }
});

var ResponseBodyViewer = Backbone.View.extend({
    initialize: function() {

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