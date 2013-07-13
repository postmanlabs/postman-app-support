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
            rawDataType:"",
            state:{size:"normal"},
            previewType:"parsed"
        };
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
        var diff = endTime = startTime;
        this.set("time", diff);
    },

    setResponseData: function(response) {
        var responseData;
        if (response.responseRawDataType === "arraybuffer") {            
            this.set("responseData", response.response);
        }
        else {
            this.set("text", response.responseText);
        }

        this.set("rawDataType", response.responseRawDataType);
    },

    setHeaders: function(response) {
        var headers = this.unpackResponseHeaders(data);

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

    // Renders the response from a request
    // Called with this = request
    load:function (response) {        
        var request = this;
        var model = this.get("response");

        if (response.readyState === 4) {
            //Something went wrong
            if (response.status === 0) {
                var errorUrl = pm.envManager.getCurrentValue(request.get("url"));
                model.trigger("failedRequest", errorUrl);                                
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

                var previewType = pm.settings.getSetting("previewType");
                var responsePreviewType = 'html';                
                
                if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
                    if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1 || pm.settings.getSetting("languageDetection") === 'javascript') {
                        language = 'javascript';
                    }

                    if (contentType.search(/image/i) >= 0) {                        
                        responsePreviewType = 'image';
                    }                    
                    else if (contentType.search(/pdf/i) >= 0 && response.responseRawDataType === "arraybuffer") {
                        responsePreviewType = 'pdf';                        
                    }                    
                    else if (contentType.search(/pdf/i) >= 0 && response.responseRawDataType === "text") {                        
                        // TODO Trigger new request                        
                    }
                    else {
                        responsePreviewType = 'html';                        
                    }
                }
                else {
                    if (pm.settings.getSetting("languageDetection") === 'javascript') {
                        language = 'javascript';
                    }                    
                }

                model.set("language", language);
                model.set("previewType", responsePreviewType);
            }                
        }
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

var ResponseBody = Backbone.Model.extend({

});