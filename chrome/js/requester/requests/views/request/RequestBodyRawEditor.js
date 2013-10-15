var RequestBodyRawEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;
        var body = this.model.get("body");

        body.on("change:data", this.onChangeBodyData, this);
        model.on("change:headers", this.onChangeHeaders, this);
    },

    onChangeHeaders: function() {
        var body = this.model.get("body");

        //Set raw body editor value if Content-Type is present
        var contentType = this.model.getHeaderValue("Content-Type");
        var editorMode = "text";
        var language = "text";

        if (contentType) {
            if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
                editorMode = 'javascript';
                language = contentType;
            }
            else if (contentType.search(/xml/i) !== -1) {
                editorMode = 'xml';
                language = contentType;
            }
            else if (contentType.search(/html/i) !== -1) {
                editorMode = 'xml';
                language = contentType;
            }
            else {
                editorMode = 'text';
                language = 'text';
            }
        }


        body.set("editorMode", editorMode);
        body.set("language", language);

        this.setEditorMode(editorMode, language, false);
    },

    onChangeBodyData: function() {
        var body = this.model.get("body");
        var mode = body.get("dataMode");
        var asObjects = body.get("asObjects");
        var data = body.get("data");
        var language = body.get("language");
        var editorMode = body.get("editorMode");

        if (mode === "raw") {
            if (data) {
                this.loadRawData(data);
            }
            else {
                this.loadRawData("");
            }
        }
        else {
            this.loadRawData("");
        }
    },

    initCodeMirrorEditor:function () {
        var model = this.model;
        var view = this;
        var body = this.model.get("body");
        var editorMode = body.get("editorMode");

        body.set("isEditorInitialized", true);

        var bodyTextarea = document.getElementById("body");
        var codeMirror = CodeMirror.fromTextArea(bodyTextarea,
        {
            mode:"htmlmixed",
            lineWrapping: true,
            lineNumbers:true,
            theme:'eclipse'
        });

        body.set("codeMirror", codeMirror);


        $("#request .CodeMirror").resizable({
            stop: function() { codeMirror.refresh(); },
            resize: function(event, ui) {
                ui.size.width = ui.originalSize.width;
                $(".CodeMirror-scroll").height($(this).height());
                codeMirror.refresh();
            }
        });

        if (editorMode) {
            if (editorMode === "javascript") {
                codeMirror.setOption("mode", {"name":"javascript", "json":true});
            }
            else {
                codeMirror.setOption("mode", editorMode);
            }

            if (editorMode === "text") {
                $('#body-editor-mode-selector-format').addClass('disabled');
            } else {
                $('#body-editor-mode-selector-format').removeClass('disabled');
            }
        }

        $("#request .CodeMirror-scroll").css("height", "200px");
        codeMirror.refresh();
    },

    setEditorMode:function (mode, language, toSetHeader) {
        var model = this.model;
        var body = model.get("body");
        var codeMirror = body.get("codeMirror");
        var isEditorInitialized = body.get("isEditorInitialized");

        var displayMode = $("#body-editor-mode-selector a[data-language='" + language + "']").html();

        $('#body-editor-mode-item-selected').html(displayMode);

        if (isEditorInitialized) {
            if (mode === "javascript") {
                codeMirror.setOption("mode", {"name":"javascript", "json":true});
            }
            else {
                codeMirror.setOption("mode", mode);
            }

            if (mode === "text") {
                $('#body-editor-mode-selector-format').addClass('disabled');
            } else {
                $('#body-editor-mode-selector-format').removeClass('disabled');
            }

            if (toSetHeader) {
                model.setHeader("Content-Type", language);
            }

            codeMirror.refresh();
        }
    },

    autoFormatEditor:function (mode) {
        var model = this.model;
        var view = this;
        var body = model.get("body");
        var isEditorInitialized = body.get("isEditorInitialized");
        var codeMirror = body.get("codeMirror");

        var content = codeMirror.getValue(),
        validated = null, result = null;

        $('#body-editor-mode-selector-format-result').empty().hide();

        if (isEditorInitialized) {
            // In case its a JSON then just properly stringify it.
            // CodeMirror does not work well with pure JSON format.
            if (mode === 'javascript') {

                // Validate code first.
                try {
                    validated = pm.jsonlint.instance.parse(content);
                    if (validated) {
                        content = JSON.parse(codeMirror.getValue());
                        codeMirror.setValue(JSON.stringify(content, null, 4));
                    }
                } catch(e) {
                    result = e.message;
                    // Show jslint result.
                    // We could also highlight the line with error here.
                    $('#body-editor-mode-selector-format-result').html(result).show();
                }
            } else { // Otherwise use internal CodeMirror.autoFormatRage method for a specific mode.
                var totalLines = codeMirror.lineCount(),
                totalChars = codeMirror.getValue().length;

                codeMirror.autoFormatRange(
                    {line: 0, ch: 0},
                    {line: totalLines - 1, ch: codeMirror.getLine(totalLines - 1).length}
                );
            }
        }
    },

    loadRawData:function (data) {
        var body = this.model.get("body");
        var isEditorInitialized = body.get("isEditorInitialized");
        var codeMirror = body.get("codeMirror");

        if (isEditorInitialized === true) {
            if (data) {
                codeMirror.setValue(data);
            }
            else {
                codeMirror.setValue("");
            }

            codeMirror.refresh();
        }
    },

    getRawData:function () {
        var model = this.model;
        var body = model.get("body");
        var isEditorInitialized = body.get("isEditorInitialized");
        var codeMirror = body.get("codeMirror");

        if (isEditorInitialized) {
            var data = codeMirror.getValue();

            if (pm.settings.getSetting("forceWindowsLineEndings") === true) {
                data = data.replace(/\r/g, '');
                data = data.replace(/\n/g, "\r\n");
            }

            return data;
        }
        else {
            return "";
        }
    }
});