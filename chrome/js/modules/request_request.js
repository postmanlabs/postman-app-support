var Request = Backbone.Model.extend({
    defaults: function() {
        return {
            url:"",
            urlParams:{},
            name:"",
            description:"",
            bodyParams:{},
            headers:[],
            method:"GET",
            dataMode:"",
            isFromCollection:false,
            collectionRequestId:"",
            methodsWithBody:["POST", "PUT", "PATCH", "DELETE", "LINK", "UNLINK"],
            areListenersAdded:false,
            startTime:0,
            endTime:0,
            xhr:null,
            editorMode:0,
            responses:[],
            body:null
        };
    },


    // Fixed
    initialize: function() {
        var requestBody = new RequestBody();
        this.body = requestBody;
    },

    // Fixed
    isMethodWithBody:function (method) {
        var methodsWithBody = this.get("methodsWithBody");
        method = method.toUpperCase();
        return $.inArray(method, methodsWithBody) >= 0;
    },

    // Fixed
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

    // Fixed
    getPackedHeaders:function () {
        return this.packHeaders(this.get("headers"));
    },

    // Fixed
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

    // Fixed
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

    // Add Github bug number
    decodeLink:function (link) {
        return $(document.createElement('div')).html(link).text();
    },

    // Fixed
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

    // Fixed
    setUrlParamString:function (params) {
        var url = $('#url').val();
        this.set("url", url);

        var paramArr = [];

        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            if (p.key && p.key !== "") {
                p.key = p.key.replace(/&/g, '%26');
                p.value = p.value.replace(/&/g, '%26');

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

        //TODO Cleaner way to do this?
        this.set("url", $('#url').val());
    },

    // Fixed
    reset:function () {
    },

    // Fixed
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

    // Fixed
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

    // Fixed
    processUrl:function (url) {
        var finalUrl = pm.envManager.getCurrentValue(url);
        finalUrl = ensureProperUrl(finalUrl);
        return finalUrl;
    },

    // Fixed
    getDummyFormDataBoundary: function() {
        var boundary = "----WebKitFormBoundaryE19zNvXGzXaLvS5C";
        return boundary;
    },

    // Fixed
    splitUrlIntoHostAndPath: function(url) {
        var path = "";
        var host;

        var parts = url.split('/');
        host = parts[2];
        var partsCount = parts.length;
        for(var i = 3; i < partsCount; i++) {
            path += "/" + parts[i];
        }

        var quesLocation = path.indexOf('?');
        var hasParams = quesLocation >= 0 ? true : false;

        if (hasParams) {
            parts = getUrlVars(path);
            var count = parts.length;
            var encodedPath = path.substr(0, quesLocation + 1);
            for (var j = 0; j < count; j++) {
                var value = parts[j].value;
                var key = parts[j].key;
                value = encodeURIComponent(value);
                key = encodeURIComponent(key);

                encodedPath += key + "=" + value + "&";
            }

            encodedPath = encodedPath.substr(0, encodedPath.length - 1);

            path = encodedPath;
        }

        return { host: host, path: path };
    },

    getAsJson:function () {
        var body = this.get("body");
        var request = {
            url: $('#url').val(),
            data: body.getData(true),
            headers: this.getPackedHeaders(),
            dataMode: this.get("dataMode"),
            method: this.get("method"),
            version: 2
        };

        return JSON.stringify(request);
    },

    startNew:function () {
        var body = this.geT("body");

        // TODO RequestEditor should be listening to this
        this.set("editorMode", 0);

        // TODO Sidebar should be listening to this event too
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');

        var xhr = this.get("xhr");

        if (xhr !== null) {
            xhr.abort();
        }

        //TODO This should trigger the proper stuff
        this.set("url", "");
        this.set("urlParams", {});
        this.set("bodyParams", {});
        this.set("name", "");
        this.set("description", "");
        this.set("headers", []);
        this.set("method", "GET");
        this.set("dataMode", ""); // TODO Check this again

        body.set("data", "");

        //TODO This goes into respective views
        $('#url-keyvaleditor').keyvalueeditor('reset');
        $('#headers-keyvaleditor').keyvalueeditor('reset');
        $('#formdata-keyvaleditor').keyvalueeditor('reset');
        $('#update-request-in-collection').css("display", "none");
        $('#url').val();
        $('#url').focus();

        //TODO This goes into the ResponseView
        pm.request.response.clear();
    },

    cancel:function () {
        var xhr = this.get("xhr");
        if (xhr !== null) {
            xhr.abort();
        }

        //TODO This goes into the ResponseView
        pm.request.response.clear();
    },

    loadRequestFromLink:function (link, headers) {
        this.startNew();

        this.set("url", pm.request.decodeLink(link));
        this.set("method", "GET");

        this.set("isFromCollection", false);

        if (pm.settings.getSetting("retainLinkHeaders") === true) {
            if (headers) {
                this.set("headers", headers);
            }
        }
    },

    loadRequestInEditor:function (request, isFromCollection, isFromSample) {
        var body = this.get("body");

        this.set("editorMode", 0);
        pm.helpers.showRequestHelper("normal");

        this.set("url", request.url);
        body.set("data", request.body);
        this.set("isFromCollection", isFromCollection);
        this.set("isFromSample", isFromSample);
        this.set("method", request.method.toUpperCase());

        if (isFromCollection) {
            $('#update-request-in-collection').css("display", "inline-block");

            if (typeof request.name !== "undefined") {
                this.set("name", request.name);
                $('#request-meta').css("display", "block");
                $('#request-name').html(request.name);
                $('#request-name').css("display", "inline-block");
            }
            else {
                this.set("name", "");
                $('#request-meta').css("display", "none");
                $('#request-name').css("display", "none");
            }

            if (typeof request.description !== "undefined") {
                this.set("description", request.description);
                $('#request-description').html(this.get("description"));
                $('#request-description').css("display", "block");
            }
            else {
                this.set("description", "");
                $('#request-description').css("display", "none");
            }

            $('#response-sample-save-form').css("display", "none");

            //Disabling pm.request. Will enable after resolving indexedDB issues
            //$('#response-sample-save-start-container').css("display", "inline-block");

            $('.request-meta-actions-togglesize').attr('data-action', 'minimize');
            $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');

            //TODO Fix this later load samples
            if ("responses" in request) {
                this.set("responses", request.responses);
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
                    this.set("responses", []);
                    $('#request-samples table').html("");
                    $("#request-samples").css("display", "none");
                }

            }
            else {
                this.set("responses", []);
                $('#request-samples table').html("");
                $("#request-samples").css("display", "none");
            }
        }
        else if (isFromSample) {
            $('#update-request-in-collection').css("display", "inline-block");
        }
        else {
            this.set("name", "");
            $('#request-meta').css("display", "none");
            $('#update-request-in-collection').css("display", "none");
        }

        if (typeof request.headers !== "undefined") {
            this.set("headers", this.unpackHeaders(request.headers));
        }
        else {
            this.set("headers", []);
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(this.get("headers").length);

        $('#url').val(this.get("url"));

        var newUrlParams = getUrlVars(this.get("url"), false);

        //@todoSet params using keyvalueeditor function
        $('#url-keyvaleditor').keyvalueeditor('reset', newUrlParams);
        $('#headers-keyvaleditor').keyvalueeditor('reset', this.get("headers"));

        // TODO Fire an event for this
        pm.request.response.clear();

        $('#request-method-selector').val(pm.request.method);

        if (this.isMethodWithBody(this.get("method"))) {
            this.set("dataMode", request.dataMode);
            $('#data').css("display", "block");

            if("version" in request) {
                if(request.version === 2) {
                    body.loadData(request.dataMode, request.data, true);
                }
                else {
                    body.loadData(request.dataMode, request.data);
                }
            }
            else {
                body.loadData(request.dataMode, request.data);
            }

        }
        else {
            this.set("dataMode", "params");
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
            language = contentType;
        }
        else if (contentType.search(/xml/i) !== -1) {
            mode = 'xml';
            language = contentType;
        }
        else if (contentType.search(/html/i) !== -1) {
            mode = 'xml';
            language = contentType;
        }
        else {
            language = 'text';
            language = contentType;
        }

        body.setEditorMode(mode, language);
        $('body').scrollTop(0);
    },

    prepareForSending: function() {
        // Set state as if change event of input handlers was called
        this.setUrlParamString(this.getUrlEditorParams());

        if (pm.helpers.getActiveHelperType() === "oauth1" && pm.helpers.getHelper("oAuth1").get("auto")) {
            pm.helpers.getHelper("oAuth1").generateHelper();
            pm.helpers.getHelper("oAuth1").process();
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);
        this.set("url", this.processUrl($('#url').val()));
        this.set("startTime", new Date().getTime());
    },

    getXhrHeaders: function() {
        this.set("headers", this.getHeaderEditorParams());

        var headers = this.getHeaderEditorParams();
        if(pm.settings.getSetting("sendNoCacheHeader") === true) {
            var noCacheHeader = {
                key: "Cache-Control",
                name: "Cache-Control",
                value: "no-cache"
            };

            headers.push(noCacheHeader);
        }

        if(pm.settings.getSetting("sendPostmanTokenHeader") === true) {
            var postmanTokenHeader = {
                key: "Postman-Token",
                name: "Postman-Token",
                value: guid()
            };

            headers.push(postmanTokenHeader);
        }

        if (this.isMethodWithBody(this.get("method"))) {
            if(this.get("dataMode") === "urlencoded") {
                var urlencodedHeader = {
                    key: "Content-Type",
                    name: "Content-Type",
                    value: "application/x-www-form-urlencoded"
                };

                headers.push(urlencodedHeader);
            }
        }

        if (pm.settings.getSetting("usePostmanProxy") === true) {
            headers = pm.request.prepareHeadersForProxy(headers);
        }

        var i;
        var finalHeaders = [];
        for (i = 0; i < headers.length; i++) {
            var header = headers[i];
            if (!_.isEmpty(header.value)) {
                header.value = pm.envManager.getCurrentValue(header.value);
                finalHeaders.push(header);
            }
        }

        return finalHeaders;
    },

    getFormDataPreview: function() {
        var rows, count, j;
        var row, key, value;
        var i;
        rows = $('#formdata-keyvaleditor').keyvalueeditor('getElements');
        count = rows.length;
        var params = [];

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
                        var fileObj = {
                            key: key,
                            value: domEl.files[i],
                            type: "file",
                        }
                        params.push(fileObj);
                    }
                }
                else {
                    value = valueElement.val();
                    value = pm.envManager.getCurrentValue(value);
                    var textObj = {
                        key: key,
                        value: value,
                        type: "text",
                    }
                    params.push(textObj);
                }
            }

            var paramsCount = params.length;
            var body = "";
            for(i = 0; i < paramsCount; i++) {
                var param = params[i];
                console.log(param);
                body += this.getDummyFormDataBoundary();
                if(param.type === "text") {
                    body += "<br/>Content-Disposition: form-data; name=\"" + param.key + "\"<br/><br/>";
                    body += param.value;
                    body += "<br/>";
                }
                else if(param.type === "file") {
                    body += "<br/>Content-Disposition: form-data; name=\"" + param.key + "\"; filename=";
                    body += "\"" + param.value.name + "\"<br/>";
                    body += "Content-Type: " + param.value.type;
                    body += "<br/><br/><br/>"
                }
            }

            body += this.getDummyFormDataBoundary();

            return body;
        }
        else {
            return false;
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
    },

    getRequestBodyPreview: function() {
        var dataMode = this.get("dataMode");
        var body = this.get("body");

        if (dataMode === 'raw') {
            var rawBodyData = body.getData(true);
            rawBodyData = pm.envManager.getCurrentValue(rawBodyData);
            return rawBodyData;
        }
        else if (dataMode === 'params') {
            var formDataBody = this.getFormDataPreview();
            if(formDataBody !== false) {
                return formDataBody;
            }
            else {
                return false;
            }
        }
        else if (dataMode === 'urlencoded') {
            var urlEncodedBodyData = this.getUrlEncodedBody();
            if(urlEncodedBodyData !== false) {
                return urlEncodedBodyData;
            }
            else {
                return false;
            }
        }
    },

    getRequestBodyToBeSent: function() {
        var dataMode = this.get("dataMode");
        var body = this.get("body");

        if (dataMode === 'raw') {
            var rawBodyData = body.getData(true);
            rawBodyData = pm.envManager.getCurrentValue(rawBodyData);
            return rawBodyData;
        }
        else if (dataMode === 'params') {
            var formDataBody = this.getFormDataBody();
            if(formDataBody !== false) {
                return formDataBody;
            }
            else {
                return false;
            }
        }
        else if (dataMode === 'urlencoded') {
            var urlEncodedBodyData = this.getUrlEncodedBody();
            if(urlEncodedBodyData !== false) {
                return urlEncodedBodyData;
            }
            else {
                return false;
            }
        }
    },

    //Send the current request
    send:function (responseRawDataType) {
        var body = this.get("body");

        pm.urlCache.refreshAutoComplete();
        this.prepareForSending();

        if (this.get("url") === "") {
            return;
        }

        var originalUrl = $('#url').val(); //Store this for saving the request

        var url = this.encodeUrl(this.get("url"));
        var method = this.get("method").toUpperCase();
        var originalData = body.getData(true);

        //Start setting up XHR
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true); //Open the XHR request. Will be sent later
        xhr.onreadystatechange = function (event) {
            pm.request.response.load(event.target);
        };

        //Response raw data type is used for fetching binary responses while generating PDFs
        if (!responseRawDataType) {
            responseRawDataType = "text";
        }

        xhr.responseType = responseRawDataType;
        var headers = this.getXhrHeaders();
        for (var i = 0; i < headers.length; i++) {
            xhr.setRequestHeader(headers[i].name, headers[i].value);
        }

        // Prepare body
        if (this.isMethodWithBody(method)) {
            var body = this.getRequestBodyToBeSent();
            if(body === false) {
                xhr.send();
            }
            else {
                xhr.send(body);
            }
        } else {
            xhr.send();
        }

        this.set("xhr", xhr);

        //Save the request
        if (pm.settings.getSetting("autoSaveRequest")) {
            pm.history.addRequest(originalUrl,
                method,
                this.getPackedHeaders(),
                originalData,
                this.get("dataMode"));
        }

        this.saveCurrentRequestToLocalStorage();

        //TODO Trigger request send event
        this.updateUiPostSending();
    },

    updateUiPostSending: function() {
        $('#submit-request').button("loading");
        pm.request.response.clear();
        pm.request.response.showScreen("waiting");
    },

    // TODO Should be activated on click
    handlePreviewClick:function() {
        var method = pm.request.method.toUpperCase();
        var httpVersion = "HTTP/1.1";
        var hostAndPath = pm.request.splitUrlIntoHostAndPath(pm.request.url);

        var path = hostAndPath.path;
        var host = hostAndPath.host;

        var headers = pm.request.getXhrHeaders();
        var hasBody = pm.request.isMethodWithBody(pm.request.method.toUpperCase());
        var body;

        if(hasBody) {
            body = pm.request.getRequestBodyPreview();
        }

        var requestPreview = method + " " + path + " " + httpVersion + "<br/>";
        requestPreview += "Host: " + host + "<br/>";

        var headersCount = headers.length;
        for(var i = 0; i < headersCount; i ++) {
            requestPreview += headers[i].key + ": " + headers[i].value + "<br/>";
        }

        if(hasBody && body !== false) {
            requestPreview += "<br/>" + body + "<br/><br/>";
        }
        else {
            requestPreview += "<br/><br/>";
        }

        $("#request-preview-content").html(requestPreview);
    }

});

var RequestBody = Backbone.Model.extend({
    defaults: function() {
        return {
            data: "",
            mode:"params",
            isEditorInitialized:false,
            codeMirror:false,
            rawEditorType:"editor",
            bodyParams: {}
        };
    },

    initialize: function() {

    },

    init:function () {
        var lastRequest = pm.settings.getSetting("lastRequest");

        if (lastRequest !== "" && lastRequest !== undefined) {
            var lastRequestParsed = JSON.parse(lastRequest);
            pm.request.isFromCollection = false;
            pm.request.loadRequestInEditor(lastRequestParsed);
        }
    },

    getHeaderValue:function (key) {
        var headers = this.get("headers");

        key = key.toLowerCase();
        for (var i = 0, count = headers.length; i < count; i++) {
            var headerKey = headers[i].key.toLowerCase();

            if (headerKey === key) {
                return headers[i].value;
            }
        }

        return false;
    },

    saveCurrentRequestToLocalStorage:function () {
        pm.settings.setSetting("lastRequest", pm.request.getAsJson());
    },

    getTotalTime:function () {
        var totalTime = this.get("endTime") - this.get("startTime");
        this.set("totalTime", totalTime);
        return totalTime;
    },

    getRawData:function () {
        if (pm.request.body.isEditorInitialized) {
            var data = pm.request.body.codeMirror.getValue();

            if (pm.settings.getSetting("forceWindowsLineEndings") === true) {
                data = data.replace(/\r/g, '');
                data = data.replace(/\n/g, "\r\n");
            }

            return data;
        }
        else {
            return "";
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

    //TODO Some part of this goes into ResponseBodyEditor
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
});