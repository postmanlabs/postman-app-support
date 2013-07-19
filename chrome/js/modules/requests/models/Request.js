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
            body:null,
            data:null
        };
    },

    // Fixed
    initialize: function() {
        var requestBody = new RequestBody();
        var response = new Response();

        this.set("body", requestBody);
        this.set("response", response);
        // this.body = requestBody;

        this.on("cancelRequest", this.onCancelRequest, this);
        this.on("startNew", this.onStartNew, this);
        this.on("send", this.onSend, this);

        this.on("readyToLoadRequest", this.onReadyToLoadRequest, this);
    },

    // TODO This can be set by the view directly. Why should the model wait for the view to initialize?
    onReadyToLoadRequest: function() {
        var lastRequest = pm.settings.getSetting("lastRequest");

        if (lastRequest !== "" && lastRequest !== undefined) {
            var lastRequestParsed = JSON.parse(lastRequest);
            this.set("isFromCollection", false);
            this.loadRequestInEditor(lastRequestParsed);
        }
    },

    onCancelRequest: function() {
        console.log("Cancel request");
    },

    onStartNew: function() {
        this.startNew();
    },

    // TODO Either text or arraybuffer
    onSend: function(type) {
        console.log("Triggered onSend", this);
        this.send(type);
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
        pm.settings.setSetting("lastRequest", this.getAsJson());
    },

    getTotalTime:function () {
        var totalTime = this.get("endTime") - this.get("startTime");
        this.set("totalTime", totalTime);
        return totalTime;
    },
    
    getPackedHeaders:function () {
        return this.packHeaders(this.get("headers"));
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

    // Add Github bug number
    decodeLink:function (link) {
        return $(document.createElement('div')).html(link).text();
    },

    // Fixed
    setUrlParamString:function (params) {
        console.log("setUrlParamString called");
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
            data: body.get("dataAsObjects"), //TODO This should be available in the model itself, asObjects = true
            headers: this.getPackedHeaders(),
            dataMode: body.get("dataMode"),
            method: this.get("method"),
            version: 2
        };

        console.log("Request is ", request);

        return JSON.stringify(request);
    },

    // TODO Needs to be refactored
    startNew:function () {
        var body = this.get("body");
        var response = this.get("response");

        // TODO RequestEditor should be listening to this
        // TODO Needs to be made clearer
        this.set("editorMode", 0);        

        var xhr = this.get("xhr");

        if (xhr !== null) {
            xhr.abort();
            this.unset("xhr");
        }

        this.set("url", "");
        this.set("urlParams", {});
        this.set("bodyParams", {});
        this.set("name", "");
        this.set("description", "");
        this.set("headers", []);
        this.set("method", "GET");
        this.set("dataMode", "");

        body.set("data", "");            

        response.trigger("clearResponse");
    },

    cancel:function () {
        var response = this.get("response");
        var xhr = this.get("xhr");
        if (xhr !== null) {
            xhr.abort();
        }

        response.clear();
    },

    loadRequestFromLink:function (link, headers) {
        this.startNew();

        this.set("url", this.decodeLink(link));
        this.set("method", "GET");

        this.set("isFromCollection", false);

        if (pm.settings.getSetting("retainLinkHeaders") === true) {
            if (headers) {
                this.set("headers", headers);
            }
        }
    },

    loadRequestInEditor:function (request, isFromCollection, isFromSample) {
        console.log("Load request in Editor", request, isFromCollection, isFromSample);

        var body = this.get("body");
        var response = this.get("response");

        this.set("editorMode", 0);
        pm.helpers.showRequestHelper("normal");

        this.set("url", request.url);

        this.set("isFromCollection", isFromCollection);
        this.set("isFromSample", isFromSample);
        this.set("method", request.method.toUpperCase());

        if (isFromCollection) {
            if (typeof request.name !== "undefined") {
                this.set("name", request.name);
            }
            else {
                this.set("name", "");
            }

            if (typeof request.description !== "undefined") {
                this.set("description", request.description);
            }
            else {
                this.set("description", "");
            }

            if ("responses" in request) {
                this.set("responses", request.responses);
                if (request.responses) {
                }
                else {
                    this.set("responses", []);
                }

            }
            else {
                this.set("responses", []);
            }
        }
        else if (isFromSample) {
        }
        else {
            this.set("name", "");
        }

        if (typeof request.headers !== "undefined") {
            this.set("headers", this.unpackHeaders(request.headers));
        }
        else {
            this.set("headers", []);
        }

        response.clear();

        if (this.isMethodWithBody(this.get("method"))) {
            body.set("dataMode", request.dataMode);

            if("version" in request) {
                if(request.version === 2) {
                    body.loadData(request.dataMode, request.data, true);
                }
                else {
                    body.loadData(request.dataMode, request.data, false);
                }
            }
            else {
                body.loadData(request.dataMode, request.data, false);
            }

        }
        else {
            body.set("dataMode", "params");
        }

        //Set raw body editor value if Content-Type is present
        var contentType = this.getHeaderValue("Content-Type");
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
            mode = 'text';
            language = contentType;
        }

        body.set("mode", "text");
        body.set("language", contentType);

        console.log(this.toJSON());
        console.log(body.toJSON());

        // TODO Should be called in RequestBodyRawEditor automatically
        // body.setEditorMode(mode, language);
        console.log("Triggering event loadRequest");
        response.trigger("clearResponse");
        this.trigger("loadRequest", this);
    },

    prepareForSending: function() {
        // TODO Would NOT work if stuff is being changed and 'Enter' is pressed
        // Set state as if change event of input handlers was called
        // this.setUrlParamString(this.getUrlEditorParams());

        if (pm.helpers.getActiveHelperType() === "oauth1" && pm.helpers.getHelper("oAuth1").get("auto")) {
            pm.helpers.getHelper("oAuth1").generateHelper();
            pm.helpers.getHelper("oAuth1").process();
        }

        var headers = this.get("headers");

        $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
        this.set("url", this.processUrl($('#url').val()));
        this.set("startTime", new Date().getTime());
    },    

    setHeader: function(key, value) {
        var headers = _.clone(this.get("headers"));
        var contentTypeHeaderKey = key;
        var pos = findPosition(headers, "key", contentTypeHeaderKey);

        if (value === 'text') {
            if (pos >= 0) {
                headers.splice(pos, 1);
            }
        }
        else {
            if (pos >= 0) {
                headers[pos] = {
                    key: contentTypeHeaderKey,
                    name: contentTypeHeaderKey,
                    value: value
                };
            }
            else {
                headers.push({key: contentTypeHeaderKey, name: contentTypeHeaderKey, value: value});
            }
        }        

        this.set("headers", headers);        
    },
    
    getXhrHeaders: function() {
        var body = this.get("body");

        var headers = _.clone(this.get("headers"));
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
            if(body.get("dataMode") === "urlencoded") {
                var urlencodedHeader = {
                    key: "Content-Type",
                    name: "Content-Type",
                    value: "application/x-www-form-urlencoded"
                };

                headers.push(urlencodedHeader);
            }
        }

        if (pm.settings.getSetting("usePostmanProxy") === true) {
            headers = this.prepareHeadersForProxy(headers);
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

    // TODO Needs to come from the view
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

    // TODO Needs to come from the view
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

    send:function (responseRawDataType) {
        var model = this;

        var body = this.get("body");
        var response = this.get("response");

        pm.urlCache.refreshAutoComplete();
        this.prepareForSending();

        if (this.get("url") === "") {
            return;
        }

        var originalUrl = this.get("url"); //Store this for saving the request

        var url = this.encodeUrl(this.get("url"));
        var method = this.get("method").toUpperCase();

        //Start setting up XHR
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true); //Open the XHR request. Will be sent later
        xhr.onreadystatechange = function (event) {
            console.log("Load response");
            _.bind(response.load, model)(event.target);
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
            var data = body.get("data");
            if(data === false) {
                xhr.send();
            }
            else {
                xhr.send(data);
            }
        } else {
            xhr.send();
        }

        this.unset("xhr");
        this.set("xhr", xhr);

        //Save the request
        if (pm.settings.getSetting("autoSaveRequest")) {
            pm.history.addRequest(originalUrl,
                method,
                this.getPackedHeaders(),
                body.get("dataAsObjects"),
                body.get("dataMode"));
        }

        var response = this.get("response");
        this.saveCurrentRequestToLocalStorage();
        response.trigger("sentRequest", this);
        this.trigger("sentRequest", this);
    },

    // TODO Should be activated on click    
    generatePreview:function() {
        console.log("Preview stuff");

        var method = this.get("method").toUpperCase();
        var httpVersion = "HTTP/1.1";
        var hostAndPath = this.splitUrlIntoHostAndPath(this.get("url"));

        var path = hostAndPath.path;
        var host = hostAndPath.host;

        var headers = this.getXhrHeaders();
        var hasBody = this.isMethodWithBody(method);
        var body;

        if(hasBody) {
            body = this.getRequestBodyPreview();
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
    },

    // TODO This should go into the model
    stripScriptTag:function (text) {
        var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
        text = text.replace(re, "");
        return text;
    }
});