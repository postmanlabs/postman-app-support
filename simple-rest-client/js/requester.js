/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */
"use strict";
function Collection() {
    this.id = "";
    this.name = "";
    this.requests = {};
}

function CollectionRequest() {
    this.collectionId = "";
    this.id = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function Request() {
    this.id = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function Response() {
    this.id = "";
    this.headers = "";
    this.text = "";
}

var postman = {};

postman.indexedDB = {};
postman.indexedDB.db = null;

// IndexedDB implementations still use API prefixes
var indexedDB = window.indexedDB || // Use the standard DB API
    window.mozIndexedDB || // Or Firefox's early version of it
    window.webkitIndexedDB;            // Or Chrome's early version
// Firefox does not prefix these two:
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

postman.initialize = function () {
    this.history.initialize();
    this.collections.initialize();
    this.settings.initialize();
    this.layout.initialize();
    this.editor.init();
    this.currentRequest.init();
    this.urlCache.refreshAutoComplete();

    postman.indexedDB.open();
};

postman.editor = {
    mode:"html",
    codeMirror:null,

    init:function () {
        CodeMirror.defineMode("links", function (config, parserConfig) {
            var linksOverlay = {
                token:function (stream, state) {
                    if (stream.eatSpace()) {
                        return null;
                    }

                    //@todo Needs to be improved
                    var matches;
                    if (matches = stream.match(/https?:\/\/[^'"]*(?=[<"'\n\t\s])/, false)) {
                        //Eat all characters before http link
                        var m = stream.match(/.*(?=https?)/, true);
                        if (m) {
                            if (m[0].length > 0) {
                                return null;
                            }
                        }

                        var currentPos = stream.current().search(matches[0]);

                        while (currentPos < 0) {
                            var ch = stream.next();
                            if (ch === "\"" || ch === "'") {
                                stream.backUp(1);
                                break;
                            }

                            if (ch == null) {
                                break;
                            }

                            currentPos = stream.current().search(matches[0]);
                        }

                        return "link";
                    }

                    stream.skipToEnd();
                }
            };

            return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || postman.editor.mode), linksOverlay);
        });
    }
};

postman.urlCache = {
    urls:[],
    addUrl:function (url) {
        if ($.inArray(url, this.urls) == -1) {
            this.urls.push(url);
            this.refreshAutoComplete();
        }
    },

    refreshAutoComplete:function () {
        $("#url").autocomplete({
            source:postman.urlCache.urls,
            delay:50
        });
    }
};

postman.settings = {
    historyCount:50,
    autoSaveRequest:true,
    initialize:function () {
        if (localStorage['historyCount']) {
            this.historyCount = localStorage['historyCount'];
        }
        else {
            this.historyCount = 100;
            localStorage['historyCount'] = this.historyCount;
        }

        if (localStorage['autoSaveRequest']) {
            this.autoSaveRequest = localStorage['autoSaveRequest'];
        }
        else {
            this.autoSaveRequest = true;
            localStorage['autoSaveRequest'] = this.autoSaveRequest;
        }

        $('#historyCount').val(this.historyCount);
        $('#autoSaveRequest').val(this.autoSaveRequest);

        $('#historyCount').change(function () {
            postman.settings.historyCount = $('#historyCount').val();
            localStorage['historyCount'] = postman.settings.historyCount;
        });

        $('#autoSaveRequest').change(function () {
            var val = $('#autoSaveRequest').val();
            if (val == 'yes') {
                postman.settings.autoSaveRequest = true;
            }
            else {
                postman.settings.autoSaveRequest = false;
            }

            localStorage['autoSaveRequest'] = postman.settings.autoSaveRequest;
        });
    }
};

postman.currentRequest = {
    url:"",
    urlParams:{},
    body:"",
    bodyParams:{},
    headers:[],
    packedHeaders: "",
    method:"get",
    dataMode:"params",
    methodsWithBody:["post", "put", "patch"],
    areListenersAdded:false,
    startTime:0,
    endTime:0,

    init:function () {
        this.url = "";
        this.urlParams = {};
        this.body = "";
        this.bodyParams = {};

        this.headers = [];
        this.packedHeaders = "";

        this.method = "get";
        this.dataMode = "params";

        if (!this.areListenersAdded) {
            this.areListenersAdded = true;
            this.addListeners();
        }

    },

    addListeners:function () {
        $('#dataModeSelector').on("click", "li a", function() {
            var mode = $(this).attr("data-mode");
            postman.currentRequest.changeDataMode(mode);
        })
    },

    changeDataMode: function(mode) {
        this.dataMode = mode;
        $('#dataModeSelector li').removeClass("active");
        $('#dataModeSelector li[data-mode="' + mode + '"]').addClass("active");

        if(mode === "params") {
            showParamsEditor('body');
            $('#bodyDataContainer').css("display", "none");
        }
        else if(mode === "raw") {
            closeParamsEditor('body');
            $('#bodyDataContainer').css("display", "block");
        }
    },

    getTotalTime:function () {
        this.totalTime = this.endTime - this.startTime;
        return this.totalTime;
    },

    response:{
        startTime:0,
        endTime:0,
        totalTime:0,
        status:"",
        time:0,
        headers:[],
        mime:"",
        text:"",
        state:{
            size:"normal"
        },
        previewType:"parsed",

        changePreviewType:function (newType) {
            this.previewType = newType;
            $('#langFormat li').removeClass('active');
            $('#langFormat-' + this.previewType).addClass('active');

            if (newType === 'raw') {
                postman.editor.codeMirror.toTextArea();
                $('#codeData').val(this.text);
                var codeDataWidth = $(document).width() - $('#sidebar').width() - 60;
                $('#codeData').css("width", codeDataWidth + "px");
                $('#codeData').css("height", "600px");
            }
            else {
                $('#codeData').css("display", "none");
                var mime = $('#codeData').attr('data-mime');
                this.setFormat(mime, this.text, "parsed", true);
            }
        },

        loadHeaders:function (data) {
            this.headers = postman.currentRequest.unpackHeaders(data);
            $('#responseHeaders').html("");
            $("#itemResponseHeader").tmpl(this.headers).appendTo("#responseHeaders");
            $('.responseHeaderName').popover();
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

        load:function (response) {
            if (response.readyState == 4) {
                //Something went wrong
                if (response.status == 0) {
                    $('#modalResponseError').modal({
                        keyboard:true,
                        backdrop:"static"
                    });

                    $('#modalResponseError').modal('show');
                    return false;
                }

                var responseCode = {
                    'code':response.status,
                    'name':httpStatusCodes[response.status]['name'],
                    'detail':httpStatusCodes[response.status]['detail']
                };

                this.text = response.responseText;
                this.endTime = new Date().getTime();

                var diff = postman.currentRequest.getTotalTime();

                $('#pstatus').html('');
                $('#itemResponseCode').tmpl([responseCode]).appendTo('#pstatus');
                $('.responseCode').popover();

                this.loadHeaders(response.getAllResponseHeaders());

                $("#respHeaders").css("display", "block");
                $("#respData").css("display", "block");

                $("#loader").css("display", "none");

                $('#ptime .data').html(diff + " ms");
                $('#pbodysize .data').html(diff + " bytes");

                var contentType = response.getResponseHeader("Content-Type");

                var format = 'html';

                if (contentType.search(/json/i) !== -1) {
                    format = 'javascript';
                }

                $('#language').val(format);

                $('#response').css("display", "block");
                $('#submitRequest').button("reset");
                $('#codeData').css("display", "block");

                if (contentType.search(/image/i) === -1) {
                    $('#responseAsText').css("display", "block");
                    $('#responseAsImage').css("display", "none");
                    $('#langFormat').css("display", "block");
                    $('#respDataActions').css("display", "block");
                    this.setFormat(format, this.text, "parsed");
                }
                else {
                    $('#responseAsText').css("display", "none");
                    $('#responseAsImage').css("display", "block");
                    var imgLink = $('#url').val();
                    $('#langFormat').css("display", "none");
                    $('#respDataActions').css("display", "none");
                    $('#responseAsImage').html("<img src='" + imgLink + "'/>");
                }
            }

            postman.layout.setLayout();
        },

        setFormat:function (mime, response, format, forceCreate) {
            $('#langFormat li').removeClass('active');
            $('#langFormat-' + format).addClass('active');
            $('#codeData').css("display", "none");

            $('#codeData').attr("data-mime", mime);

            var codeDataArea = document.getElementById("codeData");
            var foldFunc;
            var mode;

            if (mime === 'javascript') {
                mode = 'javascript';
                foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
            }
            else if (mime === 'html') {
                mode = 'xml';
                foldFunc = CodeMirror.newFoldFunction(CodeMirror.tagRangeFinder);
            }

            postman.editor.mode = mode;
            if (!postman.editor.codeMirror || forceCreate) {
                postman.editor.codeMirror = CodeMirror.fromTextArea(codeDataArea,
                    {
                        mode:"links",
                        lineNumbers:true,
                        fixedGutter:true,
                        onGutterClick:foldFunc,
                        theme:'eclipse',
                        lineWrapping:true,
                        readOnly:true
                    });

                postman.editor.codeMirror.setValue(response);

            }
            else {
                postman.editor.codeMirror.setValue(response);
                postman.editor.codeMirror.setOption("onGutterClick", foldFunc);
                postman.editor.codeMirror.setOption("mode", "links");
                postman.editor.codeMirror.setOption("lineWrapping", true);
                postman.editor.codeMirror.setOption("theme", "eclipse");
                postman.editor.codeMirror.setOption("readOnly", true);
            }

            $('#codeData').val(response);
        },

        toggleBodySize:function () {
            if (this.state.size === "normal") {
                this.state.size = "maximized";
                $('#responseBodyToggle img').attr("src", "img/full-screen-exit-alt-2.png");
                this.state.width = $('#respData').width();
                this.state.height = $('#respData').height();
                this.state.display = $('#respData').css("display");
                this.state.position = $('#respData').css("position");

                $('#respData').css("position", "absolute");
                $('#respData').css("left", 0);
                $('#respData').css("top", 0);
                $('#respData').css("width", $(document).width() - 20);
                $('#respData').css("height", $(document).height());
                $('#respData').css("z-index", 100);
                $('#respData').css("background-color", "white");
                $('#respData').css("padding", "10px");
            }
            else {
                this.state.size = "normal";
                $('#responseBodyToggle img').attr("src", "img/full-screen-alt-4.png");
                $('#respData').css("position", this.state.position);
                $('#respData').css("left", 0);
                $('#respData').css("top", 0);
                $('#respData').css("width", this.state.width);
                $('#respData').css("height", this.state.height);
                $('#respData').css("z-index", 10);
                $('#respData').css("background-color", "white");
                $('#respData').css("padding", "0px");
            }
        }
    },

    startNew:function () {
        this.init();
        this.refreshLayout();
        showParamsEditor("headers");
        $('#url').focus();
        this.response.clear();
    },

    setMethod:function (method) {
        this.method = method;
        this.refreshLayout();
    },

    refreshLayout:function () {
        $('#url').val(this.url);

        if (this.isMethodWithBody(this.method)) {
            $("#data").css("display", "block");
            showParamsEditor('body');
        } else {
            closeParamsEditor('body');
            $("#data").css("display", "none");
        }
    },

    loadRequestFromLink:function (link) {
        this.init();
        this.url = link;
        this.method = "get";
        this.refreshLayout();
    },

    isMethodWithBody:function (method) {
        return $.inArray(method, this.methodsWithBody) >= 0;
    },

    setHeadersParamString:function (headers) {
        this.headers = headers;
        var paramString = this.packHeaders();
        this.packedHeaders = paramString;
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

    unpackHeaders:function (data) {
        if (data === null || data === "") {
            return [];
        }
        else {
            var vars = [], hash;
            var hashes = data.split('\n');
            var header;

            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split(":");
                if (!hash[0]) {
                    continue;
                }

                header = {
                    "name":$.trim(hash[0]),
                    "key":$.trim(hash[0]),
                    "value":$.trim(hash[1]),
                    "description":headerDetails[$.trim(hash[0]).toLowerCase()]
                };

                vars.push(header);
            }

            return vars;
        }
    },

    loadRequestInEditor:function (request) {
        showRequestHelper("normal");
        this.url = request.url;
        this.body = request.body;
        this.method = request.method;
        this.headers = this.unpackHeaders(request.headers);

        //Initialize bodyParams
        //Initialize urlParams

        $('#url').val(request.url);

        this.packedHeaders = request.headers;

        showParamsEditor('headers');
        closeParamsEditor('url');
        this.response.clear();

        $('#requestMethodSelector').val(this.method);

        if (this.isMethodWithBody(this.method)) {
            this.dataMode = request.dataMode;

            $('#data').css("display", "block");
            this.body = request.data;

            //@todo Process bodyParams
            $('#body').val(request.data);
            this.changeDataMode(this.dataMode);
        }
        else {
            $('#body').val("");
            $('#data').css("display", "none");
            closeParamsEditor("body");
        }

        $('body').scrollTop(0);
    },

    setBodyParamString:function (params) {
        var paramsLength = params.length;
        var paramArr = [];
        for (var i = 0; i < paramsLength; i++) {
            var p = params[i];
            if (p.name && p.name !== "") {
                paramArr.push(p.name + "=" + p.value);
            }
        }
        $('#body').val(paramArr.join('&'));
    },

    setUrlParamString:function (params) {
        this.url = $('#url').val();
        var url = this.url;

        var paramArr = [];
        var urlParams = getUrlVars(url);
        var p;
        var i;
        for (i = 0; i < urlParams.length; i++) {
            p = urlParams[i];
            if (p.key && p.key !== "") {
                paramArr.push(p.key + "=" + p.value);
            }
        }
        for (i = 0; i < params.length; i++) {
            p = params[i];
            if (p.name && p.name !== "") {
                paramArr.push(p.name + "=" + p.value);
            }
        }

        var baseUrl = url.split("?")[0];
        $('#url').val(baseUrl + "?" + paramArr.join('&'));
    },

    //Send the current request
    send:function () {
        //Show error
        this.url = $('#url').val();
        this.body = $('#body').val();

        if (this.url === "") {
            return;
        }

        var xhr = new XMLHttpRequest();

        var url = this.url;
        var method = this.method;
        var data = this.body;
        var finalBodyData;
        var headers = this.headers;

        postman.currentRequest.startTime = new Date().getTime();

        xhr.onreadystatechange = function (event) {
            postman.currentRequest.response.load(event.target);
        };

        url = ensureProperUrl(url);

        xhr.open(method, url, true);

        for (var i = 0; i < headers.length; i++) {
            var header = headers[i];
            if (!_.isEmpty(header.value)) {
                xhr.setRequestHeader(header.name, header.value);
            }
        }

        if (this.isMethodWithBody(method)) {
            if (this.dataMode === 'raw') {
                finalBodyData = data;
            }
            else if (this.dataMode === 'params') {
                finalBodyData = new FormData();

                //Iterate through all key/values for files or params
                //Not sure if this has to be handled at run time
                $('input[data-section=body]').each(function () {
                    var valueEl = $(this).next();
                    var type = valueEl.attr('type');
                    var val = $(this).val();

                    if (val !== '') {
                        if (type === 'file') {
                            var domEl = $(this).next().get(0);
                            var len = domEl.files.length;
                            for (var i = 0; i < len; i++) {
                                finalBodyData.append(val, domEl.files[i]);
                            }
                        }
                        else {
                            finalBodyData.append(val, valueEl.val());
                        }
                    }
                });
            }
            xhr.send(finalBodyData);
        } else {
            xhr.send();
        }

        if (postman.settings.autoSaveRequest) {
            postman.history.addRequest(url, method, this.packedHeaders, data, this.dataMode);
        }

        $('#submitRequest').button("loading");

        this.response.clear();
    }
};


postman.history = {
    requests:{},

    initialize:function () {
        $('.history-actions-delete').click(function () {
            postman.history.clear();
        });
    },

    showEmptyMessage:function () {
        $('#emptyHistoryMessage').css("display", "block");
    },

    hideEmptyMessage:function () {
        $('#emptyHistoryMessage').css("display", "none");
    },

    requestExists:function (request) {
        var index = -1;
        var method = request.method.toLowerCase();

        if (postman.currentRequest.isMethodWithBody(method)) {
            return -1;
        }

        var requests = this.requests;
        var len = requests.length;

        for (var i = 0; i < len; i++) {
            var r = requests[i];
            if (r.url.length !== request.url.length ||
                r.headers.length !== request.headers.length ||
                r.method !== request.method) {
                index = -1;
            }
            else {
                if (r.url === request.url) {
                    if (r.headers === request.headers) {
                        index = i;
                    }
                }
            }

            if (index >= 0) {
                break;
            }
        }

        return index;
    },

    getAllRequests:function () {
        postman.indexedDB.getAllRequestItems(function (historyRequests) {
            var outAr = [];
            for (var i = 0; i < historyRequests.length; i++) {
                var r = historyRequests[i];
                postman.urlCache.addUrl(r.url);

                var url = historyRequests[i].url;

                if (url.length > 80) {
                    url = url.substring(0, 80) + "...";
                }
                url = limitStringLineWidth(url, 40);

                var request = {
                    url:url,
                    method:historyRequests[i].method,
                    id:historyRequests[i].id,
                    position:"top"
                };

                outAr.push(request);
            }

            outAr.reverse();

            $('#itemHistorySidebarRequest').tmpl(outAr).prependTo('#historyItems');
            $('#historyItems').fadeIn();
            postman.history.requests = historyRequests;
            if (postman.history.requests.length === 0) {
                $('#messageNoHistoryTmpl').tmpl([
                    {}
                ]).appendTo('#sidebarSection-history');
            }
        });

    },

    loadRequest:function (id) {
        postman.indexedDB.getRequest(id, function (request) {
            postman.currentRequest.loadRequestInEditor(request);
        });
    },

    addRequest:function (url, method, headers, data, dataMode) {
        var id = guid();
        var maxHistoryCount = postman.settings.historyCount;
        var requests = this.requests;
        var requestsCount = this.requests.length;

        if (requestsCount >= maxHistoryCount) {
            //Delete the last request
            var lastRequest = requests[requestsCount - 1];
            this.deleteRequest(lastRequest.id);
        }

        var historyRequest = {
            "id":id,
            "url":url.toString(),
            "method":method.toString(),
            "headers":headers.toString(),
            "data":data.toString(),
            "dataMode":dataMode.toString(),
            "timestamp":new Date().getTime()
        };

        var index = this.requestExists(historyRequest);

        if (index >= 0) {
            var deletedId = requests[index].id;
            this.deleteRequest(deletedId);
        }

        postman.indexedDB.addRequest(historyRequest, function (request) {
            postman.urlCache.addUrl(request.url);
            postman.layout.sidebar.addRequest(request.url, request.method, id, "top");
            postman.history.requests.push(request);
        });
    },


    deleteRequest:function (id) {
        postman.indexedDB.deleteRequest(id, function (request_id) {
            var historyRequests = postman.history.requests;
            var k = -1;
            var len = historyRequests.length;
            for (var i = 0; i < len; i++) {
                if (historyRequests[i].id === request_id) {
                    k = i;
                    break;
                }
            }

            if (k >= 0) {
                historyRequests.splice(k, 1);
            }

            postman.layout.sidebar.removeRequestFromHistory(request_id);
        });
    },

    clear:function () {
        postman.indexedDB.deleteHistory(function () {
            $('#historyItems').html("");
            $('#messageNoHistoryTmpl').tmpl([new Object()]).appendTo('#sidebarSection-history');
        });
    }
};

postman.collections = {
    items:[],

    initialize:function () {
        this.addCollectionListeners();
    },

    addCollectionListeners:function () {
        $('#collectionItems').on("mouseenter", ".sidebarCollection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'block');
        });

        $('#collectionItems').on("mouseleave", ".sidebarCollection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'none');
        });

        $('#collectionItems').on("click", ".sidebar-collection-head-name", function () {
            var id = $(this).attr('data-id');
            postman.collections.toggleRequestList(id);
        });

        $('#collectionItems').on("click", ".collection-head-actions .label", function () {
            var id = $(this).parent().parent().parent().attr('data-id');
            postman.collections.toggleRequestList(id);
        });

        $('#collectionItems').on("click", ".request-actions-delete", function () {
            var id = $(this).attr('data-id');
            postman.collections.deleteCollectionRequest(id);
        });

        $('#collectionItems').on("click", ".request-actions-load", function () {
            var id = $(this).attr('data-id');
            postman.collections.getCollectionRequest(id);
        });

        $('#collectionItems').on("click", ".collection-actions-delete", function () {
            var id = $(this).attr('data-id');
            postman.collections.deleteCollection(id);
        });
    },

    getCollectionRequest:function (id) {
        postman.indexedDB.getCollectionRequest(id, function (request) {
            postman.currentRequest.loadRequestInEditor(request);
        });
    },

    toggleRequestList:function (id) {
        var target = "#collectionRequests-" + id;
        var label = "#collection-" + id + " .collection-head-actions .label";
        if ($(target).css("display") === "none") {
            $(label).html("Hide");
            $(target).slideDown(100);
        }
        else {
            $(label).html("Show");
            $(target).slideUp(100);
        }
    },

    addCollection:function () {
        var newCollection = $('#newCollectionBlank').val();

        var collection = new Collection();

        if (newCollection) {
            //Add the new collection and get guid
            collection.id = guid();
            collection.name = newCollection;
            postman.indexedDB.addCollection(collection, function (collection) {
                $('#messageNoCollection').remove();
                postman.collections.getAllCollections();
                postman.indexedDB.getAllRequestsInCollection(collection.id);
            });

            $('#newCollectionBlank').val("");
        }

        $('#formModalNewCollection').modal('hide');
    },

    addRequestToCollection:function () {
        var existingCollectionId = $('#selectCollection').val();
        var newCollection = $("#newCollection").val();
        var collection = new Collection();

        var collectionRequest = new CollectionRequest();
        collectionRequest.id = guid();
        collectionRequest.headers = this.packedHeaders;
        collectionRequest.url = $("#url").val();
        collectionRequest.method = postman.currentRequest.method;
        collectionRequest.data = $('#body').val();
        collectionRequest.dataMode = postman.currentRequest.dataMode;
        collectionRequest.time = new Date().getTime();

        if (newCollection) {
            //Add the new collection and get guid
            collection.id = guid();
            collection.name = newCollection;
            postman.indexedDB.addCollection(collection, function (collection) {
                $('#newCollection').val("");
                collectionRequest.collectionId = collection.id;
                $('#itemCollectionSelectorList').tmpl([collection]).appendTo('#selectCollection');
                $('#itemCollectionSidebarHead').tmpl([collection]).appendTo('#collectionItems');
                postman.layout.refreshScrollPanes();
                postman.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                    var targetElement = "#collectionRequests-" + req.collectionId;
                    postman.urlCache.addUrl(req.url);

                    req.url = limitStringLineWidth(req.url, 43);
                    $('#itemCollectionSidebarRequest').tmpl([req]).appendTo(targetElement);
                    postman.layout.refreshScrollPanes();
                    $('#messageNoCollection').remove();
                });
            });
        }
        else {
            //Get guid of existing collection
            collection.id = existingCollectionId;
            collectionRequest.collectionId = collection.id;
            postman.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                var targetElement = "#collectionRequests-" + req.collectionId;
                postman.urlCache.addUrl(req.url);

                req.url = limitStringLineWidth(req.url, 43);
                $('#itemCollectionSidebarRequest').tmpl([req]).appendTo(targetElement);
                postman.layout.refreshScrollPanes();
                $('#messageNoCollection').remove();
            });
        }
    },

    getAllCollections:function () {
        $('#collectionItems').html("");
        $('#selectCollection').html("<option>Select</option>");
        postman.indexedDB.getCollections(function (items) {
            postman.collections.items = items;
            if (items.length == 0) {
                //Replace this with showEmptyMessage
                $('#messageNoCollectionTmpl').tmpl([
                    {}
                ]).appendTo('#sidebarSection-collections');
            }

            $('#itemCollectionSelectorList').tmpl(items).appendTo('#selectCollection');
            $('#itemCollectionSidebarHead').tmpl(items).appendTo('#collectionItems');

            var itemsLength = items.length;
            for (var i = 0; i < itemsLength; i++) {
                postman.collections.getAllRequestsInCollection(items[i].id);
            }

            postman.layout.refreshScrollPanes();
        });
    },

    getAllRequestsInCollection:function (id) {
        $('#collectionRequests-' + id).html("");
        postman.indexedDB.getAllRequestsInCollection(id, function (requests) {
            var targetElement = "#collectionRequests-" + id;
            var count = requests.length;

            for (var i = 0; i < count; i++) {
                postman.urlCache.addUrl(requests[i].url);
                requests[i].url = limitStringLineWidth(requests[i].url, 40);
            }

            $('#itemCollectionSidebarRequest').tmpl(requests).appendTo(targetElement);
            postman.layout.refreshScrollPanes();
        });
    },

    deleteCollectionRequest:function (id) {
        postman.indexedDB.deleteCollectionRequest(id, function () {
            postman.layout.sidebar.removeRequestFromHistory(id);
        });
    },

    deleteCollection:function (id) {
        postman.indexedDB.deleteCollection(id, function () {
            postman.layout.sidebar.removeCollection(id);

            var target = '#selectCollection option[value="' + id + '"]';
            $(target).remove();

            var numCollections = $('#collectionItems').children().length;
            if (numCollections === 1) {
                $('#messageNoCollectionTmpl').tmpl([
                    {}
                ]).appendTo('#sidebarSection-collections');
            }
        });
    }
};

postman.layout = {
    socialButtons:{
        "facebook":'<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Ffdmmgilgnpjigdojojpjoooidkmcomcm&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;appId=26438002524" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>',
        "twitter":'<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm" data-text="I am using Postman to kick some API ass!" data-count="horizontal" data-via="a85">Tweet</a><script type="text/javascript" src="http://platform.twitter.com/widgets.js"></script>',
        "plusOne":'<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script><g:plusone size="medium" href="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm"></g:plusone>'
    },

    initialize:function () {
        $('#responseBodyToggle').on("click", function () {
            postman.currentRequest.response.toggleBodySize();
        });

        $('#langFormat').on("click", "a", function () {
            var previewType = $(this).attr('data-type');
            postman.currentRequest.response.changePreviewType(previewType);
        });

        this.sidebar.initialize();

        postman.currentRequest.response.clear();

        $("#submitRequest").click(function () {
            postman.currentRequest.send();
        });

        $('#requestMethodSelector').change(function () {
            var val = $(this).val();
            postman.currentRequest.setMethod(val);
        });

        $('#sidebarSelectors li a').click(function () {
            var id = $(this).attr('data-id');
            postman.layout.sidebar.select(id);
        });

        $('a[rel="tooltip"]').tooltip();

        $('#formAddToCollection').submit(function () {
            postman.collections.addRequestToCollection();
            $('#formModalAddToCollection').modal('hide');
            return false;
        });

        $('#formModalAddToCollection .btn-primary').click(function () {
            postman.collections.addRequestToCollection();
            $('#formModalAddToCollection').modal('hide');
        });

        $('#formNewCollection').submit(function () {
            postman.collections.addCollection();
            return false;
        });

        $('#formModalNewCollection .btn-primary').click(function () {
            postman.collections.addCollection();
            return false;
        });

        $(window).resize(function () {
            postman.layout.setLayout();
        });

        $('#respData').on("click", ".cm-link", function () {
            var link = $(this).html();
            postman.currentRequest.loadRequestFromLink(link);
        });

        $('#modalAboutPostman').click(function () {
            postman.layout.attachSocialButtons();
            return false;
        });

        this.setLayout();
    },

    attachSocialButtons:function () {
        var currentContent = $('#aboutPostmanTwitterButton').html();
        if (currentContent === "" || !currentContent) {
            $('#aboutPostmanTwitterButton').html(this.socialButtons.twitter);
        }

        currentContent = $('#aboutPostmanPlusOneButton').html();
        if (currentContent === "" || !currentContent) {
            $('#aboutPostmanPlusOneButton').html(this.socialButtons.plusOne);
        }

        currentContent = $('#aboutPostmanFacebookButton').html();
        if (currentContent === "" || !currentContent) {
            $('#aboutPostmanFacebookButton').html(this.socialButtons.facebook);
        }
    },

    setLayout:function () {
        this.refreshScrollPanes();
    },

    refreshScrollPanes:function () {
        var newMainWidth = $('#container').width() - $('#sidebar').width();
        $('#main').width(newMainWidth + "px");

        $('#sidebar').jScrollPane({
            mouseWheelSpeed:24
        });
    },

    sidebar:{
        currentSection:"history",
        sections:[ "history", "collections" ],
        initialize:function () {
            $('#historyItems').on("click", ".request-actions-delete", function () {
                var request_id = $(this).attr('data-request-id');
                postman.history.deleteRequest(request_id);
            });

            $('#historyItems').on("click", ".request", function () {
                var request_id = $(this).attr('data-request-id');
                postman.history.loadRequest(request_id);
            });

            this.addRequestListeners();
        },

        select:function (section) {
            $('#sidebarSection-' + this.currentSection).css("display", "none");
            $('#' + this.currentSection + 'Options').css("display", "none");

            this.currentSection = section;

            $('#sidebarSection-' + section).fadeIn();
            $('#' + section + 'Options').css("display", "block");
            return true;
        },

        addRequest:function (url, method, id, position) {
            if (url.length > 80) {
                url = url.substring(0, 80) + "...";
            }
            url = limitStringLineWidth(url, 40);

            var request = {
                url:url,
                method:method,
                id:id,
                position:position
            };

            if (position === 'top') {
                $('#itemHistorySidebarRequest').tmpl([request]).prependTo('#historyItems');
            }
            else {
                $('#itemHistorySidebarRequest').tmpl([request]).appendTo('#historyItems');
            }

            $('#messageNoHistory').remove();
            postman.layout.refreshScrollPanes();
        },

        addRequestListeners:function () {
            $('#sidebarContainer').on("mouseenter", ".sidebarRequest", function () {
                var actionsEl = jQuery('.request-actions', this);
                actionsEl.css('display', 'block');
            });

            $('#sidebarContainer').on("mouseleave", ".sidebarRequest", function () {
                var actionsEl = jQuery('.request-actions', this);
                actionsEl.css('display', 'none');
            });
        },

        removeRequestFromHistory:function (id, toAnimate) {
            if (toAnimate) {
                $('#sidebarRequest-' + id).slideUp(100);
            }
            else {
                $('#sidebarRequest-' + id).remove();
            }

            if (postman.history.requests.length === 0) {
                postman.history.showEmptyMessage();
            }
            else {
                postman.history.hideEmptyMessage();
            }

            postman.layout.refreshScrollPanes();
        },

        removeCollection:function (id) {
            $('#collection-' + id).slideUp(100);
            postman.layout.refreshScrollPanes();
        }
    }
};

postman.indexedDB = {
    onerror:function (event) {
        console.log(event);
    },

    open:function () {
        var request = indexedDB.open("postman", "POSTman request history");
        request.onsuccess = function (e) {
            var v = "0.42";
            postman.indexedDB.db = e.target.result;
            var db = postman.indexedDB.db;

            //We can only create Object stores in a setVersion transaction
            if (v !== db.version) {
                console.log(v, "Version is not the same");
                var setVrequest = db.setVersion(v);

                setVrequest.onfailure = function (e) {
                    console.log(e);
                };

                setVrequest.onsuccess = function (e) {
                    console.log(e);
                    if (db.objectStoreNames.contains("requests")) {
                        db.deleteObjectStore("requests");
                    }
                    if (db.objectStoreNames.contains("collections")) {
                        db.deleteObjectStore("collections");
                    }
                    if (db.objectStoreNames.contains("collection_requests")) {
                        db.deleteObjectStore("collection_requests");
                    }

                    var requestStore = db.createObjectStore("requests", {keyPath:"id"});
                    var collectionsStore = db.createObjectStore("collections", {keyPath:"id"});
                    var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath:"id"});

                    requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    collectionsStore.createIndex("timestamp", "timestamp", { unique:false});

                    collectionRequestsStore.createIndex("timestamp", "timestamp", { unique:false});
                    collectionRequestsStore.createIndex("collectionId", "collectionId", { unique:false});

                    postman.history.getAllRequests();
                    postman.collections.getAllCollections();
                };
            }
            else {
                postman.history.getAllRequests();
                postman.collections.getAllCollections();
            }

        };

        request.onfailure = postman.indexedDB.onerror;
    },

    addCollection:function (collection, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        var request = store.put({
            "id":collection.id,
            "name":collection.name,
            "timestamp":new Date().getTime()
        });

        request.onsuccess = function () {
            callback(collection);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    addCollectionRequest:function (req, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collection_requests");

        var collectionRequest = store.put({
            "collectionId":req.collectionId,
            "id":req.id,
            "url":req.url.toString(),
            "method":req.method.toString(),
            "headers":req.headers.toString(),
            "data":req.data.toString(),
            "dataMode":req.dataMode.toString(),
            "timestamp":req.timestamp
        });

        collectionRequest.onsuccess = function () {
            callback(req);
        };

        collectionRequest.onerror = function (e) {
            console.log(e.value);
        };
    },

    getCollections:function (callback) {
        var db = postman.indexedDB.db;

        if (db == null) {
            return;
        }

        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collections");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = store.openCursor(keyRange);
        var numCollections = 0;
        var items = [];
        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                callback(items);
                return;
            }

            var collection = result.value;
            numCollections++;

            items.push(collection);

            result['continue']();
        };

        cursorRequest.onerror = function (e) {
            console.log(e);
        };
    },

    getAllRequestsInCollection:function (id, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        var requests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(requests);
                return;
            }

            var request = result.value;
            requests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    },

    addRequest:function (historyRequest, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");
        var request = store.put(historyRequest);

        request.onsuccess = function (e) {
            callback(historyRequest);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    getRequest:function (id, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            callback(result);
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    },

    getCollectionRequest:function (id, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("collection_requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            callback(result);
            return result;
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    },


    getAllRequestItems:function (callback) {
        var db = postman.indexedDB.db;
        if (db == null) {
            return;
        }

        var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore("requests");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var index = store.index("timestamp");
        var cursorRequest = index.openCursor(keyRange);
        var historyRequests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(historyRequests);
                return;
            }

            var request = result.value;
            historyRequests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };

        cursorRequest.onerror = postman.indexedDB.onerror;
    },

    deleteRequest:function (id, callback) {
        try {
            var db = postman.indexedDB.db;
            var trans = db.transaction(["requests"], IDBTransaction.READ_WRITE);
            var store = trans.objectStore(["requests"]);

            var request = store.delete(id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        }
        catch (e) {
            console.log(e);
        }

    },

    deleteHistory:function (callback) {
        var db = postman.indexedDB.db;
        var clearTransaction = db.transaction(["requests"], IDBTransaction.READ_WRITE);
        var clearRequest = clearTransaction.objectStore(["requests"]).clear();
        clearRequest.onsuccess = function (event) {
            callback();
        };
    },

    deleteCollectionRequest:function (id, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore(["collection_requests"]);

        var request = store.delete(id);

        request.onsuccess = function (e) {
            callback(id);
        };

        request.onerror = function (e) {
            console.log(e);
        };
    },

    //@todo Why is this unused?
    deleteAllCollectionRequests:function (id) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collection_requests"], IDBTransaction.READ_WRITE);

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                return;
            }

            var request = result.value;
            postman.collections.deleteCollectionRequest(request.id);
            result['continue']();
        };
        cursorRequest.onerror = postman.indexedDB.onerror;
    },

    deleteCollection:function (id, callback) {
        var db = postman.indexedDB.db;
        var trans = db.transaction(["collections"], IDBTransaction.READ_WRITE);
        var store = trans.objectStore(["collections"]);

        var request = store.delete(id);

        request.onsuccess = function () {
            callback(id);
        };

        request.onerror = function (e) {
            console.log(e);
        };
    }
};


//Sets the param strings for header and url params
function setParamsFromEditor(section) {
    var paramString = "";
    var h = [];

    //Goes through each item in the param editor and generates a param string

    //Will be replaced by a key value processor
    $('input[data-section="' + section + '"]').each(function () {
        var val = $(this).next().val();
        if (val !== "" && $(this).val() !== "") {
            if (section !== 'headers') {
                paramString += $(this).val() + "=" + val + "&";
            }
            else {
                paramString += $(this).val() + ": " + val + "\n";
            }

            if (section == "headers") {
                var header = {
                    name:$(this).val(),
                    value:val
                };

                h.push(header);
            }
        }
    });


    paramString = paramString.substr(0, paramString.length - 1);

    if (section === 'url') {
        var url = $('#url').val();
        var baseUrl = url.split("?")[0];
        $('#' + section).val(baseUrl + "?" + paramString);
        postman.currentRequest.url = $('#url').val();
    }
    else if (section === 'body') {
        $('#' + section).val(paramString);
        postman.currentRequest.body = paramString;
    }
    else if (section === 'headers') {
        postman.currentRequest.headers = h;
        postman.currentRequest.packedHeaders = postman.currentRequest.packHeaders(h);
    }
}

function showParamsEditor(section) {
    var data = $('#' + section).val();

    var params;
    var placeHolderKey = "Key";
    var placeHolderValue = "Value";

    if (section === 'headers') {
        params = postman.currentRequest.headers;
        placeHolderKey = "Header";
        placeHolderValue = "Value";
    }
    else if (section === 'body') {
        params = getUrlVars(data);
    }
    else {
        params = getUrlVars(data);
    }

    var editorHtml = "";
    var i = 0;
    var paramsLength = params.length;
    var rowData = {};
    var rows = [];

    $('#' + section + '-ParamsFields').html("");
    for (var index = 0; i < paramsLength; index++) {
        var element = params[index];
        var key = element.key;
        var value = element.value;

        if (key != "") {
            rowData = {
                section:section,
                placeHolderKey:placeHolderKey,
                placeHolderValue:placeHolderValue,
                key:key,
                value:value,
                inputType:"text",
                canBeClosed:true
            };
            rows.push(rowData);
        }

        i++;
    }

    rowData = {
        section:section,
        placeHolderKey:placeHolderKey,
        placeHolderValue:placeHolderValue,
        key:"",
        value:"",
        inputType:"text",
        canBeClosed:false
    };

    rows.push(rowData);

    $('#itemParamsEditor').tmpl(rows).appendTo('#' + section + '-ParamsFields');
    $('#' + section + '-ParamsEditor').fadeIn();
    addEditorListeners(section);
}

function closeParamsEditor(section) {
    $('#' + section + '-ParamsFields div:last input').unbind('focus', sectionParamsLastInputFocusHandler);
    $('#' + section + '-ParamsFields input').unbind('blur', sectionParamsInputBlurHandler);
    $('#' + section + '-ParamsEditor input.key').autocomplete("destroy");
    $('#' + section + '-ParamsEditor').css("display", "none");
}

function addParamInEditor(section, data) {
    var placeHolderKey = "Key";
    var placeHolderValue = "Value";

    if (section === 'headers') {
        placeHolderKey = "Header";
        placeHolderValue = "Value";
    }


    var key = "";
    var value = "";

    if (data) {
        key = data.key;
        value = data.value;
    }

    var rowData = {
        section:section,
        placeHolderKey:placeHolderKey,
        placeHolderValue:placeHolderValue,
        key:key,
        value:value,
        canBeClosed:false,
        inputType:"text"
    };

    $('#itemParamsEditor').tmpl([rowData]).appendTo('#' + section + '-ParamsFields');
    addEditorListeners(section);
}

var sectionParamsLastInputFocusHandler = function () {
    //Select parent element
    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    var section = id.split("-")[0];

    $('#' + section + '-ParamsFields div:last input').unbind('focus', sectionParamsLastInputFocusHandler);

    var parent = $(this).parent();

    //Add a delete link
    var deleteHtml = "<a href=\"javascript:void(0);\" class=\"deleteParam\">";
    deleteHtml += "<img class=\"deleteButton\" src=\"img/delete.png\"/>";
    deleteHtml += "</a>";
    parent.append(deleteHtml);

    addParamInEditor(section);
    return true;
};

var sectionParamsInputBlurHandler = function () {
    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    var section = id.split("-")[0];
    setParamsFromEditor(section);
};

var sectionParamsSelectChangeHandler = function () {
    //var paramType = $('#' + section + '-ParamsFields div select').val();
    var paramType = $(this).val();

    var placeHolderKey = "Key";
    var placeHolderValue = "Value";

    var key = "";
    var value = "";
    var send = "";

    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    var section = id.split("-")[0];

    if (paramType) {
        var rowData = {
            section:section,
            placeHolderKey:placeHolderKey,
            placeHolderValue:placeHolderValue,
            key:key,
            value:value,
            inputType:"text",
            canBeClosed:false
        };

        if ($(this).siblings().length > 2) {
            rowData.canBeClosed = true;
        }

        if (paramType === "text") {
            rowData.selectedText = "selected";
            rowData.selectedFile = "";
        }
        else {
            rowData.selectedText = "";
            rowData.selectedFile = "selected";
        }

        rowData.inputType = paramType;

        $('#itemParamsEditor').tmpl([rowData]).appendTo($(this).parent().empty());
        addEditorListeners(section);
    }
};

var deleteParamHandler = function () {
    var fieldsParent = $(this).parents(".editorFields");
    var id = fieldsParent.attr("id");
    if (id) {
        var section = id.split("-")[0];
        $(this).parent().remove();
        setParamsFromEditor(section);
    }
};

function addEditorListeners(section) {
    $('#' + section + '-ParamsFields div:last input').bind("focus", sectionParamsLastInputFocusHandler);
    $('#' + section + '-ParamsFields div input').bind("blur", sectionParamsInputBlurHandler);
    $('#' + section + '-ParamsFields div select').bind("change", sectionParamsSelectChangeHandler);
    $('.deleteParam').bind("click", deleteParamHandler);

    if (section === 'headers') {
        addHeaderAutoComplete();
    }

    $('#' + section + '-ParamsFields div input').unbind('keydown', 'esc', escInputHandler);
    $('#' + section + '-ParamsFields div select').unbind('keydown', 'esc', escInputHandler);
    $('#' + section + '-ParamsFields div input').bind('keydown', 'esc', escInputHandler);
    $('#' + section + '-ParamsFields div select').bind('keydown', 'esc', escInputHandler);
}

//Headers list from Wikipedia http://en.wikipedia.org/wiki/List_of_HTTP_header_fields
function addHeaderAutoComplete() {
    $("#headers-ParamsFields .key").autocomplete({
        source:chromeHeaders,
        delay:50
    });
}

var escInputHandler = function (evt) {
    $(evt.target).blur();
};

function setupKeyboardShortcuts() {

    var selectGetHandler = function () {
        postman.currentRequest.setMethod('get');
        return false;
    };

    var selectPostHandler = function () {
        postman.currentRequest.setMethod('post');
        return false;
    };

    var selectPutHandler = function () {
        postman.currentRequest.setMethod('put');
        return false;
    };

    var selectDeleteHandler = function () {
        postman.currentRequest.setMethod('delete');
        return false;
    };

    var selectHeadHandler = function () {
        postman.currentRequest.setMethod('head');
        return false;
    };

    var selectOptionsHandler = function () {
        postman.currentRequest.setMethod('options');
        return false;
    };

    var clearHistoryHandler = function () {
        postman.history.clear();
        return false;
    };

    var urlFocusHandler = function () {
        $('#url').focus();
        return false;
    };

    var newRequestHandler = function () {
        postman.currentRequest.startNew();
    };

    $('input').bind('keydown', 'esc', escInputHandler);
    $('textarea').bind('keydown', 'esc', escInputHandler);
    $('select').bind('keydown', 'esc', escInputHandler);

    $(document).bind('keydown', 'alt+1', selectGetHandler);
    $(document).bind('keydown', 'alt+2', selectPostHandler);
    $(document).bind('keydown', 'alt+3', selectPutHandler);
    $(document).bind('keydown', 'alt+4', selectDeleteHandler);
    $(document).bind('keydown', 'alt+5', selectHeadHandler);
    $(document).bind('keydown', 'alt+6', selectOptionsHandler);
    $(document).bind('keydown', 'alt+c', clearHistoryHandler);
    $(document).bind('keydown', 'backspace', urlFocusHandler);
    $(document).bind('keydown', 'alt+n', newRequestHandler);

    $(document).bind('keydown', 'h', function () {
        $('#headers-ParamsFields div:first-child input:first-child').focus();
        return false;
    });

    $(document).bind('keydown', 'return', function () {
        postman.currentRequest.send();
        return false;
    });

    $(document).bind('keydown', 'p', function () {
        if (postman.currentRequest.isMethodWithBody(postman.currentRequest.method)) {
            $('#body-ParamsFields div:first-child input:first-child').focus();
            return false;
        }
    });

    $(document).bind('keydown', 'f', function () {
        postman.currentRequest.response.toggleBodySize();
    });

    $(document).bind('keydown', 'shift+/', function () {

    });

    $(document).bind('keydown', 'a', function () {
        $('#formModalAddToCollection').modal({
            keyboard:true,
            backdrop:"static"
        });
        $('#formModalAddToColllection').modal('show');
        $('#selectCollectionContainer').focus();

        //Focus on the form element
        return false;
    });
}

function processBasicAuthRequestHelper() {
    var headers = postman.currentRequest.headers;

    var headersLength = headers.length;
    var pos = -1;

    //Improve this or put it inside a function
    for (var i = 0; i < headersLength; i++) {
        var h = headers[i];
        if (h.name === "Authorization") {
            pos = i;
            break;
        }
    }

    var authHeaderKey = "Authorization";
    var username = $('#requestHelper-basicAuth-username').val();
    var password = $('#requestHelper-basicAuth-password').val();
    var rawString = username + ":" + password;
    var encodedString = "Basic " + btoa(rawString);

    if (pos >= 0) {
        headers[pos] = {
            name:authHeaderKey,
            value:encodedString
        };
    }
    else {
        headers.push({name:authHeaderKey, value:encodedString});
    }

    postman.currentRequest.headers = headers;
    postman.currentRequest.setHeadersParamString(headers);
    showParamsEditor("headers");
}

function hideRequestHelper(type) {
    $('#requestHelpers').css("display", "none");

    if (type === 'basicAuth') {
        processBasicAuthRequestHelper();
    }
    else if (type === 'oAuth1') {
        processOAuth1RequestHelper();
    }
    return false;
}

function showRequestHelper(type) {
    $("#requestTypes ul li").removeClass("active");
    $('#requestTypes ul li[data-id=' + type + ']').addClass('active');
    if (type !== "normal") {
        $('#requestHelpers').css("display", "block");
    }
    else {
        $('#requestHelpers').css("display", "none");
    }

    if (type.toLowerCase() === 'oauth1') {
        generateOAuth1RequestHelper();
    }

    $('.requestHelpers').css("display", "none");
    $('#requestHelper-' + type).css("display", "block");
    return false;
}

function setupRequestHelpers() {
    $("#requestTypes ul li").bind("click", function () {
        $("#requestTypes ul li").removeClass("active");
        $(this).addClass("active");
        var type = $(this).attr('data-id');
        showRequestHelper(type);
    });
}

function generateOAuth1RequestHelper() {
    $('#requestHelper-oauth1-timestamp').val(OAuth.timestamp());
    $('#requestHelper-oauth1-nonce').val(OAuth.nonce(6));
}

function generateSignature() {
    if ($('#url').val() === '') {
        $('#requestHelpers').css("display", "block");
        alert('Please enter the URL first.');
        return null;
    }
    var message = {
        action:$('#url').val().trim(),
        method:postman.currentRequest.method,
        parameters:[]
    };

    //all the fields defined by oauth
    $('input.signatureParam').each(function () {
        if ($(this).val() != '') {
            message.parameters.push([$(this).attr('key'), $(this).val()]);
        }
    });
    //all the extra GET parameters
    $('#body-ParamsFields input.key, #url-ParamsFields input.key').each(function () {
        if ($(this).val() != '') {
            message.parameters.push([$(this).val(), $(this).next().val()]);
        }
    });

    var accessor = {};
    if ($('input[key="oauth_consumer_secret"]').val() != '') {
        accessor.consumerSecret = $('input[key="oauth_consumer_secret"]').val();
    }
    if ($('input[key="oauth_token_secret"]').val() != '') {
        accessor.tokenSecret = $('input[key="oauth_token_secret"]').val();
    }

    return OAuth.SignatureMethod.sign(message, accessor);
}

function processOAuth1RequestHelper() {
    var params = [];

    var signatureKey = "oauth_signature";
    var signature = generateSignature();
    if (signature == null) {
        return;
    }

    params.push({name:signatureKey, value:signature});

    $('input.signatureParam').each(function () {
        if ($(this).val() != '') {
            params.push({name:$(this).attr('key'), value:$(this).val()});
        }
    });

    if (postman.currentRequest.method === "get") {
        postman.currentRequest.setUrlParamString(params);
        showParamsEditor("url");
    } else {
        postman.currentRequest.setBodyParamString(params);
        showParamsEditor("body");
    }

}

$(document).ready(function () {
    postman.initialize();

    setupKeyboardShortcuts();
    setupRequestHelpers();
    showParamsEditor("headers");
});