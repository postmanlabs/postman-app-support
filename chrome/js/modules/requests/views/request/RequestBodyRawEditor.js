var RequestBodyRawEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;
        var body = this.model.get("body");

        var body = this.model.get("body");
        body.on("change:data", this.onChangeBodyData, this);
    },

    onChangeBodyData: function() {
        var body = this.model.get("body");
        var mode = body.get("dataMode");
        var asObjects = body.get("asObjects");
        var data = body.get("data");

        console.log("Set RawEditor data", mode, data);

        if (mode === "raw") {
            if (data) {
                this.loadRawData(data);    
            }            
        }
    },

    initCodeMirrorEditor:function () {
        var model = this.model;
        var view = this;
        var body = this.model.get("body");

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

            // TODO Can be shifted to the model
            if (toSetHeader) {
                var headers = this.model.get("headers");
                var contentTypeHeaderKey = "Content-Type";
                var pos = findPosition(headers, "key", contentTypeHeaderKey);

                if (language === 'text') {
                    if (pos >= 0) {
                        headers.splice(pos, 1);
                    }
                }
                else {
                    if (pos >= 0) {
                        headers[pos] = {
                            key: contentTypeHeaderKey,
                            name: contentTypeHeaderKey,
                            value: language
                        };
                    }
                    else {
                        headers.push({key: contentTypeHeaderKey, name: contentTypeHeaderKey, value: language});
                    }
                }

                this.model.set("headers", headers);
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
                codeMirror.refresh();    
            }            
        }
    },

    getRawData:function () {
        var model = this.model;
        var body = model.get("body");
        var isEditorInitialized = body.get("isEditorInitialized");
        var codeMirror = body.get("codeMirror");

        console.log("Trying to get raw data");

        if (isEditorInitialized) {
            console.log("Editor is initialized");

            var data = codeMirror.getValue();

            if (pm.settings.getSetting("forceWindowsLineEndings") === true) {
                data = data.replace(/\r/g, '');
                data = data.replace(/\n/g, "\r\n");
            }

            return data;
        }
        else {
            console.log("Editor is not initialized");
            return "";
        }
    }
});