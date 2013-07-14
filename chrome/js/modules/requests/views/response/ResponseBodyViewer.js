var ResponseBodyViewer = Backbone.View.extend({
    initialize: function() {
        this.responseBodyPrettyViewer = new ResponseBodyPrettyViewer({model: this.model});
        this.responseBodyRawViewer = new ResponseBodyRawViewer({model: this.model});        
        this.responseBodyImageViewer = new ResponseBodyImageViewer({model: this.model});
        this.responseBodyIframeViewer = new ResponseBodyIframeViewer({model: this.model});
        this.responseBodyPDFViewer = new ResponseBodyPDFViewer({model: this.model});
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
        var request = this.model;
        var response = request.get("response");
        var previewType = response.get("previewType");
        var text = response.get("text");

        if (previewType === newType) {
            return;
        }

        previewType = newType;
        response.set("previewType", newType);
        pm.settings.setSetting("previewType", newType);

        $('#response-formatting a').removeClass('active');
        $('#response-formatting a[data-type="' + previewType + '"]').addClass('active');        

        if (newType === 'raw') {
            $('#response-as-text').css("display", "block");
            $('#response-as-code').css("display", "none");
            $('#response-as-preview').css("display", "none");
            $('#code-data-raw').val(text);
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
        var request = this.model;
        var response = request.get("response");
        var state = response.get("state");

        console.log("Response model is", response);

        if ($('#response').css("display") === "none") {
            return false;
        }

        $('a[rel="tooltip"]').tooltip('hide');

        if (state.size === "normal") {
            state.size = "maximized";
            $('#response-body-toggle img').attr("src", "img/full-screen-exit-alt-2.png");
            state.width = $('#response-data').width();
            state.height = $('#response-data').height();
            state.display = $('#response-data').css("display");
            state.position = $('#response-data').css("position");

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
            state.size = "normal";
            $('#response-body-toggle img').attr("src", "img/full-screen-alt-4.png");
            $('#response-data').css("position", state.position);
            $('#response-data').css("left", 0);
            $('#response-data').css("top", 0);
            $('#response-data').css("width", state.width);
            $('#response-data').css("height", state.height);
            $('#response-data').css("z-index", 10);
            $('#response-data').css("background-color", "#fff");
            $('#response-data').css("padding", "0px");
        }

        response.set("state", state);
    },
});