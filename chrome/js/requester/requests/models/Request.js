var Request = Backbone.Model.extend({
    defaults: function() {
        return {
            url:"",
            pathVariables:{},
            urlParams:{},
            name:"",
            description:"",
            descriptionFormat:"markdown",
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
            data:null,
            previewHtml:"",
            curlHtml:""
        };
    },

    // Fixed
    initialize: function() {
        var requestBody = new RequestBody();
        var response = new Response();

        this.set("body", requestBody);
        this.set("response", response);

        this.on("cancelRequest", this.onCancelRequest, this);
        this.on("startNew", this.onStartNew, this);
        this.on("send", this.onSend, this);

        pm.mediator.on("addRequestURLParam", this.onAddRequestURLParam, this);
        pm.mediator.on("addRequestHeader", this.onAddRequestHeader, this);

        pm.mediator.on("loadRequest", this.loadRequest, this);
        pm.mediator.on("saveSampleResponse", this.saveSampleResponse, this);
        pm.mediator.on("loadSampleResponse", this.loadSampleResponse, this);
        pm.mediator.on("getRequest", this.onGetRequest, this);
        pm.mediator.on("updateCollectionRequest", this.checkIfCurrentRequestIsUpdated, this);
    },

    onAddRequestURLParam: function(param) {
        var urlParams = this.getUrlParams();
        var index = arrayObjectIndexOf(urlParams, "access_token", "key");

        if (index >= 0) {
            urlParams.splice(index, 1);
        }

        urlParams.push(param);
        this.setUrlParamString(urlParams);
        this.trigger("customURLParamUpdate");
    },

    onAddRequestHeader: function(param) {
        this.setHeader(param.key, param.value);
        this.trigger("customHeaderUpdate");
    },

    onGetRequest: function(callback) {
        callback(this);
    },

    onCancelRequest: function() {
        this.cancel();
    },

    onStartNew: function() {
        this.startNew();
    },

    onSend: function(type, action) {
        this.send(type, action);
    },

    isMethodWithBody:function (method) {
        return pm.methods.isMethodWithBody(method);
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

    setPathVariables: function(params) {
        this.set("pathVariables", params);
    },

    getPathVariables: function() {
        return this.get("pathVariables");
    },

    getUrlParams: function() {
        var params = getUrlVars(this.get("url"));
        return params;
    },

    setUrlParams: function(params) {
        this.set("urlParams", params);
    },

    setUrlParamString:function (params, silent) {
        console.log("Set the URL param string");
        var paramArr = [];
        var url = this.get("url");

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
            url = baseUrl + "?" + paramArr.join('&');
        }
        else {
            //Has key/val pair
            if (url.indexOf("?") > 0 && url.indexOf("=") > 0) {
                url = baseUrl;
            }
        }

        if (silent) {
            this.set("url", url, { "silent": true });
            this.trigger("updateURLInputText");
        }
        else {
            this.set("url", url);
        }

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

    getFinalRequestUrl: function(url) {
        var finalUrl;

        finalUrl = replaceURLPathVariables(url, this.get("pathVariables"));
        finalUrl = this.encodeUrl(finalUrl);
        finalUrl = pm.envManager.getCurrentValue(finalUrl);
        finalUrl = ensureProperUrl(finalUrl);

        return finalUrl;
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
        var finalUrl = pm.envManager.getCurrentValue(url);
        finalUrl = ensureProperUrl(finalUrl);
        return finalUrl;
    },

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

    getAsObject: function() {
        var body = this.get("body");

        var request = {
            url: this.get("url"),
            pathVariables: this.get("pathVariables"),
            data: body.get("dataAsObjects"),
            headers: this.getPackedHeaders(),
            dataMode: body.get("dataMode"),
            method: this.get("method"),
            version: 2
        };

        return request;
    },

    getAsJson:function () {
        var body = this.get("body");

        var request = {
            url: this.get("url"),
            pathVariables: this.get("pathVariables"),
            data: body.get("dataAsObjects"), //TODO This should be available in the model itself, asObjects = true
            headers: this.getPackedHeaders(),
            dataMode: body.get("dataMode"),
            method: this.get("method"),
            version: 2
        };

        return JSON.stringify(request);
    },

    startNew:function () {
        var body = this.get("body");
        var response = this.get("response");

        // TODO RequestEditor should be listening to this
        // TODO Needs to be made clearer
        this.set("editorMode", 0);

        var xhr = this.get("xhr");

        if (xhr) {
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
        this.set("isFromCollection", false);
        this.set("collectionRequestId", "");
        this.set("responses", []);

        body.set("data", "");

        this.trigger("loadRequest", this);
        response.trigger("clearResponse");
    },

    cancel:function () {
        console.log("Cancel request");

        var response = this.get("response");
        var xhr = this.get("xhr");
        if (xhr !== null) {
            xhr.abort();
        }

        response.clear();
    },

    saveSampleResponse: function(r) {
        var sampleRequest = this.getAsObject();
        var response = r;
        var collectionRequestId = this.get("collectionRequestId");

        response.request = sampleRequest;

        if (collectionRequestId) {
            var responses = this.get("responses");
            responses.push(response);
            this.trigger("change:responses");
            pm.mediator.trigger("addResponseToCollectionRequest", collectionRequestId, response);
        }
    },

    loadSampleResponseById: function(responseId) {
        var responses = this.get("responses");
        var location = arrayObjectIndexOf(responses, responseId, "id");
        console.log("Loading", responses, responses[location]);
        this.loadSampleResponse(responses[location]);
    },

    deleteSampleResponseById: function(responseId) {
        var collectionRequestId = this.get("collectionRequestId");

        if (collectionRequestId) {
            var responses = this.get("responses");
            var location = arrayObjectIndexOf(responses, responseId, "id");
            responses.splice(location, 1);
            this.trigger("change:responses");
            pm.mediator.trigger("updateResponsesForCollectionRequest", collectionRequestId, responses);
        }
    },

    loadSampleResponse: function(response) {
        this.set("url", response.request.url);
        this.set("method", response.request.method);

        console.log("Loading sample response headers", response.request.headers);

        this.set("headers", this.unpackHeaders(response.request.headers));
        this.set("data", response.request.data);
        this.set("dataMode", response.request.dataMode);

        this.trigger("loadRequest", this);

        var r = this.get("response");
        r.loadSampleResponse(this, response);
    },

    loadRequest: function(request, isFromCollection, isFromSample) {
        console.log(request);

        var body = this.get("body");
        var response = this.get("response");

        this.set("editorMode", 0);

        this.set("url", request.url);

        if ("pathVariables" in request) {
            this.set("pathVariables", request.pathVariables);
        }
        else {
            this.set("pathVariables", []);
        }

        this.set("isFromCollection", isFromCollection);
        this.set("isFromSample", isFromSample);
        this.set("method", request.method.toUpperCase());

        if (isFromCollection) {
            this.set("collectionid", request.collectionid);
            this.set("collectionRequestId", request.id);

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

        response.trigger("clearResponse");
        this.trigger("loadRequest", this);
    },

    loadRequestFromLink:function (link, headers) {
        this.trigger("startNew");

        this.set("url", this.decodeLink(link));
        this.set("method", "GET");
        this.set("isFromCollection", false);

        if (pm.settings.getSetting("retainLinkHeaders") === true) {
            if (headers) {
                this.set("headers", headers);
            }
        }
    },

    prepareForSending: function() {
        console.log("Preparing request for sending", pm.helpers.getActiveHelperType(), pm.helpers.getHelper("oAuth1").get("auto"));

        if (pm.helpers.getActiveHelperType() === "oAuth1" && pm.helpers.getHelper("oAuth1").get("auto")) {
            console.log("Generating oAuth1 helper");
            pm.helpers.getHelper("oAuth1").generateHelper();
            pm.helpers.getHelper("oAuth1").process();
        }

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
                this.setHeader("Content-Type", "application/x-www-form-urlencoded");
            }

            headers = _.clone(this.get("headers"));
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

    getRequestBodyPreview: function() {
        var body = this.get("body");
        return body.get("dataAsPreview");
    },

    getRequestBodyForCurl: function() {
        var body = this.get("body");
        return body.getBodyForCurl();
    },

    send:function (responseRawDataType, action) {
        this.set("action", action);

        var model = this;
        var body = this.get("body");
        var response = this.get("response");

        this.prepareForSending();

        if (this.get("url") === "") {
            return;
        }

        var originalUrl = this.get("url"); //Store this for saving the request

        var url = this.getFinalRequestUrl(this.get("url"));

        var method = this.get("method").toUpperCase();

        //Start setting up XHR
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true); //Open the XHR request. Will be sent later
        xhr.onreadystatechange = function (event) {
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
            console.log("Send a method with body", data);
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
            console.log("Saving data", body.get("dataAsObjects"));
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

    generateCurl: function() {
        var method = this.get("method").toUpperCase();

        var url = this.getFinalRequestUrl(this.get("url"));

        var headers = this.getXhrHeaders();
        var hasBody = this.isMethodWithBody(method);
        var body;

        if(hasBody) {
            body = this.getRequestBodyForCurl();
        }

        var requestPreview = "curl -X " + method;
        var headersCount = headers.length;

        for(var i = 0; i < headersCount; i++) {
            requestPreview += " -H " + headers[i].key + ":" + headers[i].value;
        }

        if(hasBody && body !== false) {
            requestPreview += body;
        }

        requestPreview += " " + url;

        requestPreview += "<br/><br/>";

        this.set("curlHtml", requestPreview);
    },

    generateHTTPRequest:function() {
        var method = this.get("method").toUpperCase();
        var httpVersion = "HTTP/1.1";

        var url = this.getFinalRequestUrl(this.get("url"));

        var hostAndPath = this.splitUrlIntoHostAndPath(url);

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
        for(var i = 0; i < headersCount; i++) {
            requestPreview += headers[i].key + ": " + headers[i].value + "<br/>";
        }

        if(hasBody && body !== false) {
            requestPreview += "<br/>" + body + "<br/><br/>";
        }
        else {
            requestPreview += "<br/><br/>";
        }

        this.set("previewHtml", requestPreview);
    },

    generatePreview: function() {
        this.generateCurl();
        this.generateHTTPRequest();
    },

    stripScriptTag:function (text) {
        if (!text) return text;

        var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
        text = text.replace(re, "");
        return text;
    },

    checkIfCurrentRequestIsUpdated: function(request) {
        console.log("Is current request updated", request);

        var id = this.get("collectionRequestId");
        if(id === request.id) {
            this.set("name", request.name);
            this.set("description", request.description);
        }
    }
});