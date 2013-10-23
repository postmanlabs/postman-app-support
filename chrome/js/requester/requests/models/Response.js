var Response = Backbone.Model.extend({
    defaults: function() {
        return {
            status:"",
            responseCode:{},
            time:0,
            headers:[],
            cookies:[],
            mime:"",
            text:"",
            language:"",
            rawDataType:"",
            state:{size:"normal"},
            previewType:"parsed"
        };
    },

    initialize: function() {
    },

    setResponseCode: function(response) {
        var responseCodeName;
        var responseCodeDetail;

        if ("statusText" in response) {
            responseCodeName = response.statusText;
            responseCodeDetail = "";

            if (response.status in httpStatusCodes) {
                responseCodeDetail = httpStatusCodes[response.status]['detail'];
            }
        }
        else {
            if (response.status in httpStatusCodes) {
                responseCodeName = httpStatusCodes[response.status]['name'];
                responseCodeDetail = httpStatusCodes[response.status]['detail'];
            }
            else {
                responseCodeName = "";
                responseCodeDetail = "";
            }
        }

        var responseCode = {
            'code':response.status,
            'name':responseCodeName,
            'detail':responseCodeDetail
        };

        this.set("responseCode", responseCode);
    },

    setResponseTime: function(startTime) {
        var endTime = new Date().getTime();
        var diff = endTime - startTime;
        this.set("time", diff);
    },

    setResponseData: function(response) {
        var responseData;

        if (response.responseType === "arraybuffer") {
            this.set("responseData", response.response);
        }
        else {
            this.set("text", response.responseText);
        }
    },

    // getAllResponseHeaders - Headers are separated by \n
    setHeaders: function(response) {
        var headers = this.unpackResponseHeaders(response.getAllResponseHeaders());

        if(pm.settings.getSetting("usePostmanProxy") === true) {
            var count = headers.length;
            for(var i = 0; i < count; i++) {
                if(headers[i].key === "Postman-Location") {
                    headers[i].key = "Location";
                    headers[i].name = "Location";
                    break;
                }
            }
        }

        // TODO Set this in the model
        headers = _.sortBy(headers, function (header) {
            return header.name;
        });

        this.set("headers", headers);
    },

    setCookies: function(url) {
        var model = this;
        /* TODO: Not available in Chrome packaged apps
        chrome.cookies.getAll({url:url}, function (cookies) {
            var count;
            model.set("cookies", cookies);
        });
        */
    },

    doesContentTypeExist: function(contentType) {
        return (!_.isUndefined(contentType) && !_.isNull(contentType))
    },

    isContentTypeJavascript: function(contentType) {
        return (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1 || pm.settings.getSetting("languageDetection") === 'javascript');
    },

    isContentTypeImage: function(contentType) {
        return (contentType.search(/image/i) >= 0);
    },

    isContentTypePDF: function(contentType) {
        return (contentType.search(/pdf/i) >= 0);
    },

    saveAsSample: function(name) {
        var response = this.toJSON();
        response.state = {size: "normal"};
        response.id = guid();
        response.name = name;

        console.log("Save this response", response);

        pm.mediator.trigger("saveSampleResponse", response);
    },

    loadSampleResponse: function(requestModel, response) {
        console.log("Load sample response", requestModel, response);

        this.set("status", response.status);
        this.set("responseCode", response.responseCode);
        this.set("time", response.time);
        this.set("headers", response.headers);
        this.set("cookies", response.cookies);
        this.set("mime", response.mime);
        this.set("language", response.language);
        this.set("text", response.text);
        this.set("rawDataType", response.rawDataType);
        this.set("state", response.state);
        this.set("previewType", response.previewType);

        this.trigger("loadResponse", requestModel);
    },

    // Renders the response from a request
    // Called with this = request
    load:function (response) {
        var request = this;
        var model = request.get("response");

        // TODO These need to be renamed something else
        var presetPreviewType = pm.settings.getSetting("previewType");
        var languageDetection = pm.settings.getSetting("languageDetection");

        if (response.readyState === 4) {
            //Something went wrong
            if (response.status === 0) {
                console.log("response.status is 0");
                var errorUrl = pm.envManager.getCurrentValue(request.get("url"));
                model.trigger("failedRequest", errorUrl);
                return;
            }
            else {
                var url = request.get("url");
                model.setResponseCode(response);
                model.setResponseTime(request.get("startTime"));

                model.setResponseData(response);
                model.setHeaders(response);
                model.setCookies(url);

                var contentType = response.getResponseHeader("Content-Type");
                var language = 'html';

                var responsePreviewType = 'html';

                if (model.doesContentTypeExist(contentType)) {
                    if (model.isContentTypeJavascript(contentType)) {
                        language = 'javascript';
                    }

                    if (model.isContentTypeImage(contentType)) {
                        responsePreviewType = 'image';
                    }
                    else if (model.isContentTypePDF(contentType) && response.responseType === "arraybuffer") {
                        responsePreviewType = 'pdf';
                    }
                    else if (model.isContentTypePDF(contentType) && response.responseType === "text") {
                        responsePreviewType = 'pdf';
                    }
                    else {
                        responsePreviewType = 'html';
                    }
                }
                else {
                    if (languageDetection === 'javascript') {
                        language = 'javascript';
                    }
                    else {
                        language = 'html';
                    }
                }

                model.set("language", language);
                model.set("previewType", responsePreviewType);
                model.set("rawDataType", response.responseType);
                model.set("state", {size: "normal"});

                model.trigger("loadResponse", model);
            }
        }
    },

    clear: function() {
        console.log("Clear the response now");
        this.trigger("clearResponse");
    },

    unpackResponseHeaders: function(data) {
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
    }
});