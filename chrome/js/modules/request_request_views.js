var RequestEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        var requestMethodEditor = new RequestMethodEditor({model: this.model});
        var requestHeaderEditor = new RequestHeaderEditor({model: this.model});
        var requestURLEditor = new RequestURLEditor({model: this.model});
        var requestBodyEditor = new RequestBodyEditor({model: this.model});
        var requestClipboard = new RequestClipboard({model: this.model});
        var requestPreviewer = new RequestPreviewer({model: this.model});

        $("#update-request-in-collection").on("click", function () {
            //This should come from the caller
            var url = $('#url').val();

            var collectionRequest = {};
            collectionRequest.id = pm.request.collectionRequestId;
            collectionRequest.headers = pm.request.getPackedHeaders();
            collectionRequest.url = url;
            collectionRequest.method = pm.request.method;
            collectionRequest.data = pm.request.body.getData(true);
            collectionRequest.dataMode = pm.request.dataMode;
            collectionRequest.version = 2;
            collectionRequest.time = new Date().getTime();

            pm.collections.updateCollectionRequest(collectionRequest);
        });

        $("#cancel-request").on("click", function () {
            // TODO This can trigger the cancel event
            pm.request.cancel();
        });

        $("#request-actions-reset").on("click", function () {
            // TODO This can trigger the start new event
            pm.request.startNew();
        });

        $('#add-to-collection').on("click", function () {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }
        });

        $("#submit-request").on("click", function () {
            // TODO This should trigger the send event
            pm.request.send("text");
        });

        $("#preview-request").on("click", function () {
            _.bind(view.onPreviewRequestClick, view)();
        });
    },

    showRequestBuilder: function() {
        $("#preview-request").html("Preview");
        this.model.set("editorMode", 0);
        $("#request-builder").css("display", "block");
        $("#request-preview").css("display", "none");
    },

    showPreview: function() {
        $("#preview-request").html("Build");
        this.model.set("editorMode", 1);
        $("#request-builder").css("display", "none");
        $("#request-preview").css("display", "block");
    },

    onPreviewRequestClick: function(event) {
        var editorMode = this.model.get("editorMode");
        if(editorMode === 1) {
            this.showRequestBuilder();
        }
        else {
            this.showPreview();
        }
    },

    refreshLayout:function () {
        $('#url').val(pm.request.url);
        $('#request-method-selector').val(pm.request.method);

        pm.request.body.loadRawData(pm.request.body.getData());

        var newUrlParams = getUrlVars(pm.request.url, false);

        //@todoSet params using keyvalueeditor function
        $('#url-keyvaleditor').keyvalueeditor('reset', newUrlParams);
        $('#headers-keyvaleditor').keyvalueeditor('reset', pm.request.headers);

        $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);
        $('#submit-request').button("reset");
        $('#data-mode-selector a').removeClass("active");
        $('#data-mode-selector a[data-mode="' + pm.request.dataMode + '"]').addClass("active");

        if (pm.request.isMethodWithBody(pm.request.method)) {
            $("#data").css("display", "block");
            var mode = pm.request.dataMode;
            pm.request.body.setDataMode(mode);
        } else {
            pm.request.body.hide();
        }

        if (pm.request.name !== "") {
            $('#request-meta').css("display", "block");
            $('#request-name').css("display", "inline-block");
            if ($('#request-description').css("display") === "block") {
                $('#request-description').css("display", "block");
            }
            else {
                $('#request-description').css("display", "none");
            }
        }
        else {
            $('#request-meta').css("display", "none");
            $('#request-name').css("display", "none");
            $('#request-description').css("display", "none");
            $('#request-samples').css("display", "none");
        }

        $('.request-help-actions-togglesize a').attr('data-action', 'minimize');
        $('.request-help-actions-togglesize img').attr('src', 'img/circle_minus.png');
    }
});

var RequestURLEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        var editorId;
        editorId = "#url-keyvaleditor";

        var params = {
            placeHolderKey:"URL Parameter Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
                model.setUrlParamString(view.getUrlEditorParams());
            },

            onBlurElement:function () {
                model.setUrlParamString(view.getUrlEditorParams());
            }
        };

        $(editorId).keyvalueeditor('init', params);

        $('#url-keyvaleditor-actions-close').on("click", function () {
            view.closeUrlEditor();
        });

        $('#url-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#url-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                view.closeUrlEditor();
            }
            else {
                var newRows = getUrlVars($('#url').val(), false);
                $(editorId).keyvalueeditor('reset', newRows);
                view.openUrlEditor();
            }

        });

        $('#url').keyup(function () {
            var newRows = getUrlVars($('#url').val(), false);
            $('#url-keyvaleditor').keyvalueeditor('reset', newRows);
        });
    },

    openUrlEditor:function () {
        $('#url-keyvaleditor-actions-open').addClass("active");
        var containerId = "#url-keyvaleditor-container";
        $(containerId).css("display", "block");
    },

    closeUrlEditor:function () {
        $('#url-keyvaleditor-actions-open').removeClass("active");
        var containerId = "#url-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    getUrlEditorParams:function () {
        var editorId = "#url-keyvaleditor";
        var params = $(editorId).keyvalueeditor('getValues');
        var newParams = [];
        for (var i = 0; i < params.length; i++) {
            var param = {
                key:params[i].key,
                value:params[i].value
            };

            newParams.push(param);
        }

        return newParams;
    }
});

var RequestMethodEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;
        $('#request-method-selector').change(function () {
            var val = $(this).val();
            _.bind(view.setMethod, view)(val);
        });
    },

    setMethod:function (method) {
        this.model.set("url", $('#url').val());
        this.model.set("method", method);

        //TODO Why do we need this?
        //TODO Caution! Changed from previous logic
        if (this.model.isMethodWithBody(method)) {
            this.model.set("dataMode", "params");
        }
        else {
            this.model.set("dataMode", "");
        }
    }
})

var RequestHeaderEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        model.on("change:headers", this.onChangeHeaders, this);

        //TODO Autocomplete for default headers is not working
        var params = {
            placeHolderKey:"Header",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onInit:function () {
            },

            onAddedParam:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.getPresetsForAutoComplete(),
                    delay:50,
                    select:function (event, item) {
                        console.log("Cat complete is on");
                        view.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onDeleteRow:function () {
                model.set("headers", view.getHeaderEditorParams(), {silent: true});
                var headers = model.get("headers");
                $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
            },

            onFocusElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.getPresetsForAutoComplete(),
                    delay:50,
                    select:function (event, item) {
                        view.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onBlurElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.getPresetsForAutoComplete(),
                    delay:50,
                    select:function (event, item) {
                        view.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
                model.set("headers", view.getHeaderEditorParams(), {silent: true});
                var headers = model.get("headers");
                $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
            },

            onReset:function () {
                var hs = $('#headers-keyvaleditor').keyvalueeditor('getValues');
                $('#headers-keyvaleditor-actions-open .headers-count').html(hs.length);
            }
        };

        $('#headers-keyvaleditor').keyvalueeditor('init', params);

        $('#headers-keyvaleditor-actions-close').on("click", function () {
            $('#headers-keyvaleditor-actions-open').removeClass("active");
            view.closeHeaderEditor();
        });

        $('#headers-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#headers-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                view.closeHeaderEditor();
            }
            else {
                view.openHeaderEditor();
            }
        });
    },

    onChangeHeaders: function() {
        var headers = this.model.get("headers");
        $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
    },

    openHeaderEditor:function () {
        $('#headers-keyvaleditor-actions-open').addClass("active");
        var containerId = "#headers-keyvaleditor-container";
        $(containerId).css("display", "block");
    },

    closeHeaderEditor:function () {
        $('#headers-keyvaleditor-actions-open').removeClass("active");
        var containerId = "#headers-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    setHeaderValue:function (key, value) {
        var headers = this.model.get("headers");
        var origKey = key;
        key = key.toLowerCase();
        var found = false;
        for (var i = 0, count = headers.length; i < count; i++) {
            var headerKey = headers[i].key.toLowerCase();

            if (headerKey === key && value !== "text") {
                headers[i].value = value;
                found = true;
            }
        }

        var editorId = "#headers-keyvaleditor";
        if (!found && value !== "text") {
            var header = {
                "key":origKey,
                "value":value
            };
            headers.push(header);
        }

        $(editorId).keyvalueeditor('reset', headers);
    },

    getHeaderEditorParams:function () {
        var hs = $('#headers-keyvaleditor').keyvalueeditor('getValues');
        var newHeaders = [];
        for (var i = 0; i < hs.length; i++) {
            var header = {
                key:hs[i].key,
                value:hs[i].value,
                name:hs[i].key
            };

            newHeaders.push(header);
        }
        return newHeaders;
    },

    onHeaderAutoCompleteItemSelect:function(item) {
        if(item.type === "preset") {
            var preset = pm.headerPresets.getHeaderPreset(item.id);
            if("headers" in preset) {
                var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
                var loc = -1;
                for(var i = 0; i < headers.length; i++) {
                    if(headers[i].key === item.label) {
                        loc = i;
                        break;
                    }
                }

                if(loc >= 0) {
                    headers.splice(loc, 1);
                }

                var newHeaders = _.union(headers, preset.headers);
                $('#headers-keyvaleditor').keyvalueeditor('reset', newHeaders);

                //Ensures that the key gets focus
                var element = $('#headers-keyvaleditor .keyvalueeditor-last input:first-child')[0];
                $('#headers-keyvaleditor .keyvalueeditor-last input:first-child')[0].focus();
                setTimeout(function() {
                    element.focus();
                }, 10);
            }
        }
    }
});

var RequestBodyEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        model.on("change:method", this.onChangeMethod, this);
        model.on("change:dataMode", this.onChangeDataMode, this);

        this.bodyFormDataEditor = new RequestBodyFormDataEditor({model: this.model});
        this.bodyURLEncodedEditor = new RequestBodyURLEncodedEditor({model: this.model});
        this.bodyRawEditor = new RequestBodyRawEditor({model: this.model});

        $('#data-mode-selector').on("click", "a", function () {
            var mode = $(this).attr("data-mode");
            view.setDataMode(mode);
        });

        $('#body-editor-mode-selector .dropdown-menu').on("click", "a", function (event) {
            var editorMode = $(event.target).attr("data-editor-mode");
            var language = $(event.target).attr("data-language");
            view.bodyRawEditor.setEditorMode(editorMode, language, true);
        });

        // 'Format code' button listener.
        $('#body-editor-mode-selector-format').on('click.postman', function(evt) {
            var editorMode = $(event.target).attr("data-editor-mode");

            if ($(evt.currentTarget).hasClass('disabled')) {
                return;
            }
        });

        var type = pm.settings.getSetting("requestBodyEditorContainerType");
        $('#request-body-editor-container-type a').removeClass('active');
        $('#request-body-editor-container-type a[data-container-type="' + type + '"]').addClass('active');

        $('#request-body-editor-container-type').on('click', 'a', function(evt) {
            var type = $(this).attr('data-container-type');
            pm.settings.setSetting("requestBodyEditorContainerType", type);
        });
    },

    openFormDataEditor:function () {
        var containerId = "#formdata-keyvaleditor-container";
        $(containerId).css("display", "block");

        var editorId = "#formdata-keyvaleditor";
        var params = $(editorId).keyvalueeditor('getValues');
        var newParams = [];
        for (var i = 0; i < params.length; i++) {
            var param = {
                key:params[i].key,
                value:params[i].value
            };

            newParams.push(param);
        }
    },

    closeFormDataEditor:function () {
        var containerId = "#formdata-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    openUrlEncodedEditor:function () {
        var containerId = "#urlencoded-keyvaleditor-container";
        $(containerId).css("display", "block");

        var editorId = "#urlencoded-keyvaleditor";
        var params = $(editorId).keyvalueeditor('getValues');
        var newParams = [];
        for (var i = 0; i < params.length; i++) {
            var param = {
                key:params[i].key,
                value:params[i].value
            };

            newParams.push(param);
        }
    },

    closeUrlEncodedEditor:function () {
        var containerId = "#urlencoded-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    onChangeMethod: function(event) {
        var method = this.model.get("method");

        if (this.model.isMethodWithBody(method)) {
            $("#data").css("display", "block");
        } else {
            $("#data").css("display", "none");
        }
    },

    onChangeDataMode: function(event) {
        var dataMode = this.model.get("dataMode");
        this.setDataMode(dataMode);
    },

    setDataMode:function (mode) {
        var model = this.model;
        var view = this;
        var body = this.model.get("body");

        this.model.get("body").set("mode", mode);

        $('#data-mode-selector a').removeClass("active");
        $('#data-mode-selector a[data-mode="' + mode + '"]').addClass("active");

        $("#body-editor-mode-selector").css("display", "none");
        if (mode === "params") {
            view.openFormDataEditor();
            view.closeUrlEncodedEditor();
            $('#body-data-container').css("display", "none");
        }
        else if (mode === "raw") {
            view.closeUrlEncodedEditor();
            view.closeFormDataEditor();
            $('#body-data-container').css("display", "block");

            var isEditorInitialized = body.get("isEditorInitialized");

            if (isEditorInitialized === false) {
                view.bodyRawEditor.initCodeMirrorEditor();
            }
            else {
                view.bodyRawEditor.codeMirror.refresh();
            }

            $("#body-editor-mode-selector").css("display", "block");
        }
        else if (mode === "urlencoded") {
            view.closeFormDataEditor();
            view.openUrlEncodedEditor();
            $('#body-data-container').css("display", "none");
        }
    },
});

var RequestBodyFormDataEditor = Backbone.View.extend({
    initialize: function() {
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
    }
});

var RequestBodyURLEncodedEditor = Backbone.View.extend({
    initialize: function() {
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
    }
});

var RequestBodyRawEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;
        var body = this.model.get("body");
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

                //TODO Check if this is called
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
            //Add proper content-type header
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
                        pm.request.body.codeMirror.setValue(JSON.stringify(content, null, 4));
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
            codeMirror.setValue(data);
            codeMirror.refresh();
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
        $("#response-copy-button").on("click", function() {
            var scrollTop = $(window).scrollTop();
            //TODO Need this to access response text in another way
            copyToClipboard(pm.request.response.text);
            $(document).scrollTop(scrollTop);
        });
    }
})