pm.request = {
    url:"",
    urlParams:{},
    name:"",
    description:"",
    bodyParams:{},
    headers:[],
    method:"GET",
    dataMode:"params",
    isFromCollection:false,
    collectionRequestId:"",
    methodsWithBody:["POST", "PUT", "PATCH", "DELETE", "LINK", "UNLINK"],
    areListenersAdded:false,
    startTime:0,
    endTime:0,
    xhr:null,
    editorMode:0,
    responses:[],

    body:{
        mode:"params",
        data:"",
        isEditorInitialized:false,
        codeMirror:false,

        init:function () {
            this.initFormDataEditor();
            this.initUrlEncodedEditor();
            this.initEditorListeners();
        },

        hide:function () {
            pm.request.body.closeFormDataEditor();
            pm.request.body.closeUrlEncodedEditor();
            $("#data").css("display", "none");
        },

        getRawData:function () {
            if (pm.request.body.isEditorInitialized) {
                return pm.request.body.codeMirror.getValue();
            }
            else {
                return "";
            }
        },

        loadRawData:function (data) {
            var body = pm.request.body;

            if (body.isEditorInitialized === true) {
                body.codeMirror.setValue(data);
                body.codeMirror.refresh();
            }
        },

        initCodeMirrorEditor:function () {
            pm.request.body.isEditorInitialized = true;
            var bodyTextarea = document.getElementById("body");
            pm.request.body.codeMirror = CodeMirror.fromTextArea(bodyTextarea,
            {
                mode:"htmlmixed",
                lineNumbers:true,
                theme:'eclipse'
            });


            $("#request .CodeMirror").resizable({
                stop: function() { pm.request.body.codeMirror.refresh(); },
                resize: function(event, ui) {
                    ui.size.width = ui.originalSize.width;
                    $(".CodeMirror-scroll").height($(this).height());                    
                    pm.request.body.codeMirror.refresh();
                }
            });

            $("#request .CodeMirror-scroll").css("height", "200px");
            pm.request.body.codeMirror.refresh();
        },

        setEditorMode:function (mode, language) {
            var displayMode = $("#body-editor-mode-selector a[data-language='" + language + "']").html();
            $('#body-editor-mode-item-selected').html(displayMode);

            if (pm.request.body.isEditorInitialized) {
                if (mode === "javascript") {
                    pm.request.body.codeMirror.setOption("mode", {"name":"javascript", "json":true});
                }
                else {
                    pm.request.body.codeMirror.setOption("mode", mode);
                }

                if (mode === "text") {
                  $('#body-editor-mode-selector-format').addClass('disabled');
                } else {
                  $('#body-editor-mode-selector-format').removeClass('disabled');
                }

                //pm.request.body.autoFormatEditor(mode);
                pm.request.body.codeMirror.refresh();
            }
        },

        autoFormatEditor:function (mode) {
          var content = pm.request.body.codeMirror.getValue(),
              validated = null, result = null;
          
          $('#body-editor-mode-selector-format-result').empty().hide();
          
          if (pm.request.body.isEditorInitialized) {
            
            // In case its a JSON then just properly stringify it.
            // CodeMirror does not work well with pure JSON format.
            if (mode === 'javascript') {
              
              // Validate code first.
              try {
                validated = pm.jsonlint.instance.parse(content);
                if (validated) {
                  content = JSON.parse(pm.request.body.codeMirror.getValue());
                  pm.request.body.codeMirror.setValue(JSON.stringify(content, null, 4));
                }
              } catch(e) {
                result = e.message;
                // Show jslint result.
                // We could also highlight the line with error here.
                $('#body-editor-mode-selector-format-result').html(result).show();
              }
            } else { // Otherwise use internal CodeMirror.autoFormatRage method for a specific mode.
              var totalLines = pm.request.body.codeMirror.lineCount(),
                  totalChars = pm.request.body.codeMirror.getValue().length;
              
              pm.request.body.codeMirror.autoFormatRange(
                {line: 0, ch: 0}, 
                {line: totalLines - 1, ch: pm.request.body.codeMirror.getLine(totalLines - 1).length}
              );
            }
          }
        },

        initFormDataEditor:function () {
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

        initUrlEncodedEditor:function () {
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

        initEditorListeners:function () {
            $('#body-editor-mode-selector .dropdown-menu').on("click", "a", function (event) {
                var editorMode = $(event.target).attr("data-editor-mode");
                var language = $(event.target).attr("data-language");
                pm.request.body.setEditorMode(editorMode, language);
            });
            
            // 'Format code' button listener.
            $('#body-editor-mode-selector-format').on('click.postman', function(evt) {
              var editorMode = $(event.target).attr("data-editor-mode");

              if ($(evt.currentTarget).hasClass('disabled')) {
                return;
              }

              //pm.request.body.autoFormatEditor(pm.request.body.codeMirror.getMode().name);
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

        setDataMode:function (mode) {
            pm.request.dataMode = mode;
            pm.request.body.mode = mode;
            $('#data-mode-selector a').removeClass("active");
            $('#data-mode-selector a[data-mode="' + mode + '"]').addClass("active");

            $("#body-editor-mode-selector").css("display", "none");
            if (mode === "params") {
                pm.request.body.openFormDataEditor();
                pm.request.body.closeUrlEncodedEditor();
                $('#body-data-container').css("display", "none");
            }
            else if (mode === "raw") {
                pm.request.body.closeUrlEncodedEditor();
                pm.request.body.closeFormDataEditor();
                $('#body-data-container').css("display", "block");

                if (pm.request.body.isEditorInitialized === false) {
                    pm.request.body.initCodeMirrorEditor();
                }
                else {
                    pm.request.body.codeMirror.refresh();
                }
                $("#body-editor-mode-selector").css("display", "block");
            }
            else if (mode === "urlencoded") {
                pm.request.body.closeFormDataEditor();
                pm.request.body.openUrlEncodedEditor();
                $('#body-data-container').css("display", "none");
            }
        },

        getDataMode:function () {
            return pm.request.body.mode;
        },

        //Be able to return direct keyvaleditor params
        getData:function (asObjects) {
            var data;
            var mode = pm.request.body.mode;
            var params;
            var newParams;
            var param;
            var i;

            if (mode === "params") {
                params = $('#formdata-keyvaleditor').keyvalueeditor('getValues');
                newParams = [];
                for (i = 0; i < params.length; i++) {
                    param = {
                        key:params[i].key,
                        value:params[i].value,
                        type:params[i].type
                    };

                    newParams.push(param);
                }

                if(asObjects === true) {
                    console.log(newParams);
                    return newParams;
                }
                else {
                    data = pm.request.getBodyParamString(newParams);    
                }
                
            }
            else if (mode === "raw") {
                data = pm.request.body.getRawData();
            }
            else if (mode === "urlencoded") {
                params = $('#urlencoded-keyvaleditor').keyvalueeditor('getValues');
                newParams = [];
                for (i = 0; i < params.length; i++) {
                    param = {
                        key:params[i].key,
                        value:params[i].value,
                        type:params[i].type
                    };

                    newParams.push(param);
                }

                if(asObjects === true) {
                    return newParams;
                }
                else {
                    data = pm.request.getBodyParamString(newParams);    
                }                
            }

            return data;
        },
        
        loadData:function (mode, data, asObjects) {
            var body = pm.request.body;
            body.setDataMode(mode);

            body.data = data;

            var params;
            if (mode === "params") {
                if(asObjects === true) {                    
                    $('#formdata-keyvaleditor').keyvalueeditor('reset', data);        
                }
                else {
                    params = getBodyVars(data, false);
                    $('#formdata-keyvaleditor').keyvalueeditor('reset', params);    
                }
                
            }
            else if (mode === "raw") {
                body.loadRawData(data);
            }
            else if (mode === "urlencoded") {
                if(asObjects === true) {
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', data);
                }
                else {
                    params = getBodyVars(data, false);
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', params);    
                }
                
            }
        }
    },


    init:function () {
        this.url = "";
        this.urlParams = {};
        this.body.data = "";
        this.bodyParams = {};

        this.headers = [];

        this.method = "GET";
        this.dataMode = "params";

        if (!this.areListenersAdded) {
            this.areListenersAdded = true;
            this.initializeHeaderEditor();
            this.initializeUrlEditor();
            this.body.init();
            this.addListeners();
        }

        var lastRequest = pm.settings.get("lastRequest");
        if (lastRequest !== "") {
            var lastRequestParsed = JSON.parse(lastRequest);
            pm.request.isFromCollection = false;
            pm.request.loadRequestInEditor(lastRequestParsed);
        }
    },

    setHeaderValue:function (key, value) {
        var headers = pm.request.headers;
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

    getHeaderValue:function (key) {
        var headers = pm.request.headers;
        key = key.toLowerCase();
        for (var i = 0, count = headers.length; i < count; i++) {
            var headerKey = headers[i].key.toLowerCase();

            if (headerKey === key) {
                return headers[i].value;
            }
        }

        return false;
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
        if(item.type == "preset") {
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
    },

    initializeHeaderEditor:function () {
        var params = {
            placeHolderKey:"Header",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onInit:function () {
            },

            onAddedParam:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.presetsForAutoComplete,
                    delay:50,
                    select:function (event, item) {
                        pm.request.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onDeleteRow:function () {
                pm.request.headers = pm.request.getHeaderEditorParams();
                $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);
            },

            onFocusElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.presetsForAutoComplete,
                    delay:50,
                    select:function (event, item) {
                        pm.request.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onBlurElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.presetsForAutoComplete,
                    delay:50,
                    select:function (event, item) {
                        pm.request.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
                pm.request.headers = pm.request.getHeaderEditorParams();
                $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);
            },

            onReset:function () {
                var hs = $('#headers-keyvaleditor').keyvalueeditor('getValues');
                $('#headers-keyvaleditor-actions-open .headers-count').html(hs.length);
            }
        };

        $('#headers-keyvaleditor').keyvalueeditor('init', params);

        $('#headers-keyvaleditor-actions-close').on("click", function () {
            $('#headers-keyvaleditor-actions-open').removeClass("active");
            pm.request.closeHeaderEditor();
        });

        $('#headers-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#headers-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                pm.request.closeHeaderEditor();
            }
            else {
                pm.request.openHeaderEditor();
            }
        });
    },

    getAsJson:function () {
        var request = {
            url:$('#url').val(),
            data:pm.request.body.getData(true),
            headers:pm.request.getPackedHeaders(),
            dataMode:pm.request.dataMode,
            method:pm.request.method,
            version:2
        };

        console.log(request);

        return JSON.stringify(request);
    },

    saveCurrentRequestToLocalStorage:function () {
        pm.settings.set("lastRequest", pm.request.getAsJson());
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
    },

    initializeUrlEditor:function () {
        var editorId;
        editorId = "#url-keyvaleditor";

        var params = {
            placeHolderKey:"URL Parameter Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
                pm.request.setUrlParamString(pm.request.getUrlEditorParams());
            },

            onBlurElement:function () {
                pm.request.setUrlParamString(pm.request.getUrlEditorParams());
            }
        };

        $(editorId).keyvalueeditor('init', params);

        $('#url-keyvaleditor-actions-close').on("click", function () {
            pm.request.closeUrlEditor();
        });

        $('#url-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#url-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                pm.request.closeUrlEditor();
            }
            else {
                var newRows = getUrlVars($('#url').val(), false);
                $(editorId).keyvalueeditor('reset', newRows);
                pm.request.openUrlEditor();
            }

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

    addListeners:function () {
        $('#data-mode-selector').on("click", "a", function () {
            var mode = $(this).attr("data-mode");
            pm.request.body.setDataMode(mode);
        });

        $('.request-meta-actions-togglesize').on("click", function () {
            var action = $(this).attr('data-action');

            if (action === "minimize") {
                $(this).attr("data-action", "maximize");
                $('.request-meta-actions-togglesize img').attr('src', 'img/circle_plus.png');
                $("#request-description-container").slideUp(100);
            }
            else {
                $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');
                $(this).attr("data-action", "minimize");
                $("#request-description-container").slideDown(100);
            }
        });

        $('#url').keyup(function () {
            var newRows = getUrlVars($('#url').val(), false);
            $('#url-keyvaleditor').keyvalueeditor('reset', newRows);
        });

        $('#add-to-collection').on("click", function () {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }
        });

        $("#submit-request").on("click", function () {
            pm.request.send("text");
        });

        $("#preview-request").on("click", function () {
            pm.request.preview();
        });

        $("#update-request-in-collection").on("click", function () {
            pm.collections.updateCollectionFromCurrentRequest();
        });

        $("#cancel-request").on("click", function () {
            pm.request.cancel();
        });

        $("#request-actions-reset").on("click", function () {
            pm.request.startNew();
        });

        $('#request-method-selector').change(function () {
            var val = $(this).val();
            pm.request.setMethod(val);
        });
    },

    getTotalTime:function () {
        this.totalTime = this.endTime - this.startTime;
        return this.totalTime;
    },

    response:{
        status:"",
        responseCode:[],
        time:0,
        headers:[],
        cookies:[],
        mime:"",
        text:"",

        state:{
            size:"normal"
        },
        previewType:"parsed",

        setMode:function (mode) {
            var text = pm.request.response.text;
            pm.request.response.setFormat(mode, text, pm.settings.get("previewType"), true);
        },

        stripScriptTag:function (text) {
            var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;            
            text = text.replace(re, "");            
            return text;
        },

        changePreviewType:function (newType) {
            if (this.previewType === newType) {
                return;
            }

            this.previewType = newType;
            $('#response-formatting a').removeClass('active');
            $('#response-formatting a[data-type="' + this.previewType + '"]').addClass('active');

            pm.settings.set("previewType", newType);

            if (newType === 'raw') {
                $('#response-as-text').css("display", "block");
                $('#response-as-code').css("display", "none");
                $('#response-as-preview').css("display", "none");
                $('#code-data-raw').val(this.text);
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

        loadHeaders:function (data) {
            this.headers = pm.request.unpackResponseHeaders(data);            

            if(pm.settings.get("usePostmanProxy") === true) {
                var count = this.headers.length;                
                for(var i = 0; i < count; i++) {
                    if(this.headers[i].key == "Postman-Location") {
                        this.headers[i].key = "Location";
                        this.headers[i].name = "Location";
                        break;
                    }                        
                }
            }

            $('#response-headers').html("");
            this.headers = _.sortBy(this.headers, function (header) {
                return header.name;
            });


            $("#response-headers").append(Handlebars.templates.response_headers({"items":this.headers}));
            $('.response-header-name').popover({
                trigger: "hover",
            });
        },

        clear:function () {
            this.startTime = 0;
            this.endTime = 0;
            this.totalTime = 0;
            this.status = "";
            this.time = 0;
            this.headers = {};
            this.mime = "";
            this.state.size = "normal";
            this.previewType = "parsed";
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

            pm.request.response.previewType = pm.settings.get("previewType");

            var responsePreviewType = 'html';

            if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
                if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
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
                }
                else {
                    responsePreviewType = 'html';
                    pm.request.response.setFormat(language, response.text, pm.settings.get("previewType"), true);
                }
            }
            else {
                pm.request.response.setFormat(language, response.text, pm.settings.get("previewType"), true);
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
            if (response.readyState == 4) {
                //Something went wrong
                if (response.status == 0) {
                    var errorUrl = pm.envManager.convertString(pm.request.url);
                    $('#connection-error-url').html(errorUrl);
                    pm.request.response.showScreen("failed");
                    $('#submit-request').button("reset");
                    return false;
                }

                pm.request.response.showScreen("success")
                pm.request.response.showBody();

                var responseCodeName;
                if ("statusText" in response) {
                    responseCodeName = response.statusText;
                }
                else {
                    responseCodeName = httpStatusCodes[response.status]['name'];
                }

                var responseCode = {
                    'code':response.status,
                    'name':responseCodeName,
                    'detail':httpStatusCodes[response.status]['detail']
                };

                var responseData;
                if (response.responseType == "arraybuffer") {
                    responseData = response.response;
                }
                else {
                    this.text = response.responseText;
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
                this.loadHeaders(response.getAllResponseHeaders());

                $('.response-tabs li[data-section="headers"]').html("Headers (" + this.headers.length + ")");
                $("#response-data").css("display", "block");

                $("#loader").css("display", "none");

                $('#response-time .data').html(diff + " ms");

                var contentType = response.getResponseHeader("Content-Type");

                $('#response').css("display", "block");
                $('#submit-request').button("reset");
                $('#code-data').css("display", "block");

                var language = 'html';

                pm.request.response.previewType = pm.settings.get("previewType");

                var responsePreviewType = 'html';

                if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
                    if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
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
                    }
                    else if (contentType.search(/pdf/i) >= 0 && response.responseType == "arraybuffer") {
                        responsePreviewType = 'pdf';

                        // Hide everything else
                        $('#response-as-code').css("display", "none");
                        $('#response-as-text').css("display", "none");
                        $('#response-as-image').css("display", "none");
                        $('#response-formatting').css("display", "none");
                        $('#response-actions').css("display", "none");
                        $("#response-language").css("display", "none");

                        $("#response-as-preview").html("");
                        $("#response-as-preview").css("display", "block");
                        $("#response-pretty-modifiers").css("display", "none");
                        pm.filesystem.renderResponsePreview("response.pdf", responseData, "pdf", function (response_url) {
                            $("#response-as-preview").html("<iframe src='" + response_url + "'/>");
                        });

                    }
                    else if (contentType.search(/pdf/i) >= 0 && response.responseType == "text") {
                        pm.request.send("arraybuffer");
                        return;
                    }
                    else {
                        responsePreviewType = 'html';
                        this.setFormat(language, this.text, pm.settings.get("previewType"), true);
                    }
                }
                else {
                    this.setFormat(language, this.text, pm.settings.get("previewType"), true);
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
                    if ("expirationDate" in cookie) {
                        var date = new Date(cookie.expirationDate * 1000);
                        cookies[i].expires = date.toUTCString();
                    }
                }

                $('#response-cookies-items').html(Handlebars.templates.response_cookies({"items":cookies}));
            }

            pm.request.response.cookies = cookies;
        },

        loadCookies:function (url) {
            chrome.cookies.getAll({url:url}, function (cookies) {
                var count;
                pm.request.response.renderCookies(cookies);
            });
        },

        setFormat:function (language, response, format, forceCreate) {
            //Keep CodeMirror div visible otherwise the response gets cut off
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
            if (pm.settings.get("lineWrapping") === true) {
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

        toggleBodySize:function () {
            if ($('#response').css("display") === "none") {
                return false;
            }

            $('a[rel="tooltip"]').tooltip('hide');
            if (this.state.size === "normal") {
                this.state.size = "maximized";
                $('#response-body-toggle img').attr("src", "img/full-screen-exit-alt-2.png");
                this.state.width = $('#response-data').width();
                this.state.height = $('#response-data').height();
                this.state.display = $('#response-data').css("display");
                this.state.position = $('#response-data').css("position");

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
                this.state.size = "normal";
                $('#response-body-toggle img').attr("src", "img/full-screen-alt-4.png");
                $('#response-data').css("position", this.state.position);
                $('#response-data').css("left", 0);
                $('#response-data').css("top", 0);
                $('#response-data').css("width", this.state.width);
                $('#response-data').css("height", this.state.height);
                $('#response-data').css("z-index", 10);
                $('#response-data').css("background-color", "#fff");
                $('#response-data').css("padding", "0px");
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

        openInNewWindow:function (data) {
            var name = "response.html";
            var type = "text/html";
            pm.filesystem.saveAndOpenFile(name, data, type, function () {
            });
        }
    },

    startNew:function () {
        if (pm.request.xhr !== null) {
            pm.request.xhr.abort();
        }

        this.url = "";
        this.urlParams = {};
        this.body.data = "";
        this.bodyParams = {};
        this.name = "";
        this.description = "";
        this.headers = [];

        this.method = "GET";
        this.dataMode = "params";

        this.refreshLayout();
        $('#url-keyvaleditor').keyvalueeditor('reset');
        $('#headers-keyvaleditor').keyvalueeditor('reset');
        $('#formdata-keyvaleditor').keyvalueeditor('reset');
        $('#update-request-in-collection').css("display", "none");
        $('#url').val();
        $('#url').focus();
        this.response.clear();
    },

    cancel:function () {
        if (pm.request.xhr !== null) {
            pm.request.xhr.abort();
        }

        pm.request.response.clear();
    },

    setMethod:function (method) {
        this.url = $('#url').val();
        this.method = method;
        this.refreshLayout();
    },

    refreshLayout:function () {
        $('#url').val(this.url);
        $('#request-method-selector').val(this.method);
        pm.request.body.loadRawData(pm.request.body.getData());
        $('#headers-keyvaleditor').keyvalueeditor('reset', this.headers);
        $('#headers-keyvaleditor-actions-open .headers-count').html(this.headers.length);
        $('#submit-request').button("reset");
        $('#data-mode-selector a').removeClass("active");
        $('#data-mode-selector a[data-mode="' + this.dataMode + '"]').addClass("active");

        if (this.isMethodWithBody(this.method)) {
            $("#data").css("display", "block");
            var mode = this.dataMode;
            pm.request.body.setDataMode(mode);
        } else {
            pm.request.body.hide();
        }

        if (this.name !== "") {
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
    },

    loadRequestFromLink:function (link, headers) {
        this.startNew();
        this.url = link;
        this.method = "GET";

        pm.request.isFromCollection = false;
        if (pm.settings.get("retainLinkHeaders") === true) {
            if (headers) {
                pm.request.headers = headers;
            }
        }

        this.refreshLayout();
    },

    isMethodWithBody:function (method) {
        method = method.toUpperCase();
        return $.inArray(method, pm.request.methodsWithBody) >= 0;
    },

    packHeaders:function (headers) {
        var headersLength = headers.length;
        var paramString = "";
        for (var i = 0; i < headersLength; i++) {
            var h = headers[i];
            if (h.name && h.name !== "") {
                paramString += h.name + ": " + h.value + "\n";
            }
        }

        return paramString;
    },

    getPackedHeaders:function () {
        return this.packHeaders(this.headers);
    },

    unpackResponseHeaders:function (data) {
        if (data === null || data === "") {
            return [];
        }
        else {
            var vars = [], hash;
            var hashes = data.split('\n');
            var header;

            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i];
                var loc = hash.search(':');

                if (loc !== -1) {
                    var name = $.trim(hash.substr(0, loc));
                    var value = $.trim(hash.substr(loc + 1));

                    header = {
                        "name":name,
                        "key":name,
                        "value":value,
                        "description":headerDetails[name.toLowerCase()]
                    };

                    vars.push(header);
                }
            }

            return vars;
        }
    },

    unpackHeaders:function (data) {
        if (data === null || data === "") {
            return [];
        }
        else {
            var vars = [], hash;
            var hashes = data.split('\n');
            var header;

            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i];
                if (!hash) {
                    continue;
                }

                var loc = hash.search(':');

                if (loc !== -1) {
                    var name = $.trim(hash.substr(0, loc));
                    var value = $.trim(hash.substr(loc + 1));
                    header = {
                        "name":$.trim(name),
                        "key":$.trim(name),
                        "value":$.trim(value),
                        "description":headerDetails[$.trim(name).toLowerCase()]
                    };

                    vars.push(header);
                }
            }

            return vars;
        }
    },

    loadRequestInEditor:function (request, isFromCollection, isFromSample) {        
        console.log(request);

        pm.helpers.showRequestHelper("normal");
        this.url = request.url;
        this.body.data = request.body;
        this.method = request.method.toUpperCase();

        if (isFromCollection) {
            $('#update-request-in-collection').css("display", "inline-block");

            if (typeof request.name !== "undefined") {
                this.name = request.name;
                $('#request-meta').css("display", "block");
                $('#request-name').html(this.name);
                $('#request-name').css("display", "inline-block");
            }
            else {
                this.name = "";
                $('#request-meta').css("display", "none");
                $('#request-name').css("display", "none");
            }

            if (typeof request.description !== "undefined") {
                this.description = request.description;
                $('#request-description').html(this.description);
                $('#request-description').css("display", "block");
            }
            else {
                this.description = "";
                $('#request-description').css("display", "none");
            }

            $('#response-sample-save-form').css("display", "none");

            //Disabling this. Will enable after resolving indexedDB issues
            //$('#response-sample-save-start-container').css("display", "inline-block");

            $('.request-meta-actions-togglesize').attr('data-action', 'minimize');
            $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');

            //Load sample
            if ("responses" in request) {
                pm.request.responses = request.responses;
                $("#request-samples").css("display", "block");
                if (request.responses) {
                    if (request.responses.length > 0) {
                        $('#request-samples table').html("");
                        $('#request-samples table').append(Handlebars.templates.sample_responses({"items":request.responses}));
                    }
                    else {
                        $('#request-samples table').html("");
                        $("#request-samples").css("display", "none");
                    }
                }
                else {
                    pm.request.responses = [];
                    $('#request-samples table').html("");
                    $("#request-samples").css("display", "none");
                }

            }
            else {
                pm.request.responses = [];
                $('#request-samples table').html("");
                $("#request-samples").css("display", "none");
            }
        }
        else if (isFromSample) {
            $('#update-request-in-collection').css("display", "inline-block");
        }
        else {
            this.name = "";
            $('#request-meta').css("display", "none");
            $('#update-request-in-collection').css("display", "none");
        }

        if (typeof request.headers !== "undefined") {
            this.headers = this.unpackHeaders(request.headers);
        }
        else {
            this.headers = [];
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(this.headers.length);

        $('#url').val(this.url);

        var newUrlParams = getUrlVars(this.url, false);

        //@todoSet params using keyvalueeditor function
        $('#url-keyvaleditor').keyvalueeditor('reset', newUrlParams);
        $('#headers-keyvaleditor').keyvalueeditor('reset', this.headers);

        this.response.clear();

        $('#request-method-selector').val(this.method);

        if (this.isMethodWithBody(this.method)) {
            this.dataMode = request.dataMode;
            $('#data').css("display", "block");

            if("version" in request) {
                if(request.version == 2) {
                    pm.request.body.loadData(request.dataMode, request.data, true);        
                }
                else {
                    pm.request.body.loadData(request.dataMode, request.data);        
                }
            }
            else {
                pm.request.body.loadData(request.dataMode, request.data);    
            }
            
        }
        else {
            $('#data').css("display", "none");
        }

        //Set raw body editor value if Content-Type is present
        var contentType = pm.request.getHeaderValue("Content-Type");
        var mode;
        var language;
        if (contentType === false) {
            mode = 'text';
            language = 'text';
        }
        else if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
            mode = 'javascript';
            language = 'json';
        }
        else if (contentType.search(/xml/i) !== -1) {
            mode = 'xml';
            language = 'xml';
        }
        else if (contentType.search(/html/i) !== -1) {
            mode = 'xml';
            language = 'html';
        }
        else {
            language = 'text';
            contentType = 'text';
        }

        pm.request.body.setEditorMode(mode, language);
        $('body').scrollTop(0);
    },

    getBodyParamString:function (params) {
        var paramsLength = params.length;
        var paramArr = [];
        for (var i = 0; i < paramsLength; i++) {
            var p = params[i];
            if (p.key && p.key !== "") {
                paramArr.push(p.key + "=" + p.value);
            }
        }
        return paramArr.join('&');
    },

    setUrlParamString:function (params) {
        this.url = $('#url').val();
        var url = this.url;

        var paramArr = [];

        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            if (p.key && p.key !== "") {
                paramArr.push(p.key + "=" + p.value);
            }
        }

        var baseUrl = url.split("?")[0];
        if (paramArr.length > 0) {
            $('#url').val(baseUrl + "?" + paramArr.join('&'));
        }
        else {
            //Has key/val pair
            if (url.indexOf("?") > 0 && url.indexOf("=") > 0) {
                $('#url').val(baseUrl);
            }
            else {
                $('#url').val(url);
            }

        }
    },

    reset:function () {
    },

    encodeUrl:function (url) {
        var quesLocation = url.indexOf('?');

        if (quesLocation > 0) {
            var urlVars = getUrlVars(url);
            var baseUrl = url.substring(0, quesLocation);
            var urlVarsCount = urlVars.length;
            var newUrl = baseUrl + "?";
            for (var i = 0; i < urlVarsCount; i++) {
                newUrl += encodeURIComponent(urlVars[i].key) + "=" + encodeURIComponent(urlVars[i].value) + "&";
            }

            newUrl = newUrl.substr(0, newUrl.length - 1);
            return url;
        }
        else {
            return url;
        }
    },

    prepareHeadersForProxy:function (headers) {
        var count = headers.length;
        for (var i = 0; i < count; i++) {
            var key = headers[i].key.toLowerCase();
            if (_.indexOf(pm.bannedHeaders, key) >= 0) {
                headers[i].key = "Postman-" + headers[i].key;
                headers[i].name = "Postman-" + headers[i].name;
            }
        }

        return headers;
    },

    processUrl:function (url) {
        var envManager = pm.envManager;
        var environment = envManager.selectedEnv;
        var envValues = [];
        var url = $('#url').val();
        
        if (environment !== null) {
            envValues = environment.values;
        }

        url = envManager.processString(url, envValues);
        url = ensureProperUrl(url);

        return url;
    },

    //Send the current request
    send:function (responseType) {
        // Set state as if change event of input handlers was called
        pm.request.setUrlParamString(pm.request.getUrlEditorParams());
        pm.request.headers = pm.request.getHeaderEditorParams();

        if (pm.helpers.activeHelper == "oauth1" && pm.helpers.oAuth1.isAutoEnabled) {            
            pm.helpers.oAuth1.generateHelper();
            pm.helpers.oAuth1.process();
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);

        var i;
        this.url = pm.request.processUrl($('#url').val());
        var envManager = pm.envManager;         
        var environment = envManager.selectedEnv;
        var envValues = [];
        var url = $('#url').val();
        
        if (environment !== null) {
            envValues = environment.values;
        }

        var url = this.url;
        this.body.data = pm.request.body.getData(true);

        if (url === "") {
            return;
        }

        var xhr = new XMLHttpRequest();
        pm.request.xhr = xhr;
        pm.request.url = url;

        url = pm.request.encodeUrl(url);

        var originalUrl = $('#url').val();
        var method = this.method.toUpperCase();

        var data = pm.request.body.getData(true);
        var originalData = data;

        console.log(originalData);

        var finalBodyData;
        var headers = this.headers;

        if (pm.settings.get("usePostmanProxy") == true) {
            headers = pm.request.prepareHeadersForProxy(headers);
        }

        pm.request.startTime = new Date().getTime();

        xhr.onreadystatechange = function (event) {
            pm.request.response.load(event.target);
        };

        if (!responseType) {
            responseType = "text";
        }

        xhr.responseType = responseType;
        xhr.open(method, url, true);

        for (i = 0; i < headers.length; i++) {
            var header = headers[i];
            if (!_.isEmpty(header.value)) {
                xhr.setRequestHeader(header.name, envManager.processString(header.value, envValues));
            }
        }

        if(pm.settings.get("sendNoCacheHeader") === true) {
            xhr.setRequestHeader("Cache-Control", "no-cache");                
        }

        var rows, count, j;
        var row, key, value;

        // Prepare body
        if (this.isMethodWithBody(method)) {
            if (this.dataMode === 'raw') {
                data = envManager.processString(data, envValues);
                finalBodyData = data;
                xhr.send(finalBodyData);
            }
            else if (this.dataMode === 'params') {
                finalBodyData = new FormData();

                rows = $('#formdata-keyvaleditor').keyvalueeditor('getElements');

                count = rows.length;

                for (j = 0; j < count; j++) {
                    row = rows[j];
                    key = row.keyElement.val();
                    var valueType = row.valueType;
                    var valueElement = row.valueElement;

                    if (valueType === "file") {
                        var domEl = valueElement.get(0);
                        var len = domEl.files.length;
                        for (i = 0; i < len; i++) {
                            finalBodyData.append(key, domEl.files[i]);
                        }
                    }
                    else {
                        value = valueElement.val();
                        value = envManager.processString(value, envValues);
                        finalBodyData.append(key, value);
                    }
                }

                if (count > 0) {
                    xhr.send(finalBodyData);
                }
                else {
                    xhr.send();
                }
            }
            else if (this.dataMode === 'urlencoded') {
                finalBodyData = "";
                rows = $('#urlencoded-keyvaleditor').keyvalueeditor('getElements');
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                count = rows.length;
                for (j = 0; j < count; j++) {
                    row = rows[j];
                    value = row.valueElement.val();
                    value = envManager.processString(value, envValues);
                    value = encodeURIComponent(value);                    
                    value = value.replace(/%20/g, '+');
                    key = encodeURIComponent(row.keyElement.val());
                    key = key.replace(/%20/g, '+');
                    
                    finalBodyData += key + "=" + value + "&";
                }

                finalBodyData = finalBodyData.substr(0, finalBodyData.length - 1);

                if (count > 0) {
                    xhr.send(finalBodyData);
                }
                else {
                    xhr.send();
                }
            }
        } else {
            xhr.send();
        }

        if (pm.settings.get("autoSaveRequest")) {
            pm.history.addRequest(originalUrl, method, pm.request.getPackedHeaders(), originalData, this.dataMode);
        }

        $('#submit-request').button("loading");
        pm.request.response.clear();
        pm.request.response.showScreen("waiting");
    },

    preview:function() {
        console.log("Preview this request");
        if(pm.request.editorMode == 1) {
            pm.request.editorMode = 0;    
            $("#request-builder").css("display", "block");
            $("#request-preview").css("display", "none");    
        }
        else {
            pm.request.editorMode = 1;    
            $("#request-builder").css("display", "none");
            $("#request-preview").css("display", "block");    
        }               
    }

};