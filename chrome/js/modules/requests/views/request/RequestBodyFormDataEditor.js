var RequestBodyFormDataEditor = Backbone.View.extend({
    initialize: function() {
        var body = this.model.get("body");
        body.on("change:data", this.onChangeBodyData, this);

        var editorId = "#formdata-keyvaleditor";

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            valueTypes:["text", "file"],
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
            },

            onBlurElement:function () {
            }
        };

        $(editorId).keyvalueeditor('init', params);
    },

    onChangeBodyData: function() {
        var body = this.model.get("body");
        var mode = body.get("mode");
        var asObjects = body.get("asObjects");
        var data = body.get("data");

        if (mode === "params") {
            if (data) {
                $('#formdata-keyvaleditor').keyvalueeditor('reset', data);    
            }            
        }
    },

    getFormDataBody: function() {
        var rows, count, j;
        var i;
        var row, key, value;
        var paramsBodyData = new FormData();
        rows = $('#formdata-keyvaleditor').keyvalueeditor('getElements');
        count = rows.length;

        if (count > 0) {
            for (j = 0; j < count; j++) {
                row = rows[j];
                key = row.keyElement.val();
                var valueType = row.valueType;
                var valueElement = row.valueElement;

                if (valueType === "file") {
                    var domEl = valueElement.get(0);
                    var len = domEl.files.length;
                    for (i = 0; i < len; i++) {
                        paramsBodyData.append(key, domEl.files[i]);
                    }
                }
                else {
                    value = valueElement.val();
                    value = pm.envManager.getCurrentValue(value);
                    paramsBodyData.append(key, value);
                }
            }

            return paramsBodyData;
        }
        else {
            return false;
        }
    }
});

var RequestBodyURLEncodedEditor = Backbone.View.extend({
    initialize: function() {
        var body = this.model.get("body");
        body.on("change:data", this.onChangeBodyData, this);

        var editorId = "#urlencoded-keyvaleditor";

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            valueTypes:["text"],
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
            },

            onBlurElement:function () {
            }
        };

        $(editorId).keyvalueeditor('init', params);
    },

    onChangeBodyData: function() {
        var body = this.model.get("body");
        var mode = body.get("mode");
        var asObjects = body.get("asObjects");
        var data = body.get("data");

        if (mode === "urlencoded") {
            if (data) {
                console.log("Data is ", data);
                try {
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', data);        
                }
                catch(e) {
                    console.log(e);
                }
                
            }
            
        }
    },

    getUrlEncodedBody: function() {
        var rows, count, j;
        var row, key, value;
        var urlEncodedBodyData = "";
        rows = $('#urlencoded-keyvaleditor').keyvalueeditor('getElements');
        count = rows.length;

        if (count > 0) {
            for (j = 0; j < count; j++) {
                row = rows[j];
                value = row.valueElement.val();
                value = pm.envManager.getCurrentValue(value);
                value = encodeURIComponent(value);
                value = value.replace(/%20/g, '+');
                key = encodeURIComponent(row.keyElement.val());
                key = key.replace(/%20/g, '+');

                urlEncodedBodyData += key + "=" + value + "&";
            }

            urlEncodedBodyData = urlEncodedBodyData.substr(0, urlEncodedBodyData.length - 1);

            return urlEncodedBodyData;
        }
        else {
            return false;
        }
    }
});

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
        var mode = body.get("mode");
        var asObjects = body.get("asObjects");
        var data = body.get("data");

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

var RequestPreviewer = Backbone.View.extend({
    initialize: function() {
        $(".request-preview-header-limitations").dropdown();
    }
});

var RequestClipboard = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var response = model.get("response");

        $("#response-copy-button").on("click", function() {
            var scrollTop = $(window).scrollTop();
            copyToClipboard(response.get("text"));
            $(document).scrollTop(scrollTop);
        });
    }
})