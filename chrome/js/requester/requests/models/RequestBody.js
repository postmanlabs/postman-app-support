var RequestBody = Backbone.Model.extend({
    defaults: function() {
        return {
            data: "",
            dataMode:"params",
            isEditorInitialized:false,
            codeMirror:false,
            rawEditorType:"editor",
            bodyParams: {},
            editorMode:"html",
            language:""
        };
    },

    initialize: function() {

    },

    getFormDataForCurl: function() {
        var dataAsObjects = this.get("dataAsObjects");
        var kv;
        console.log(dataAsObjects);
        var body = "";
        for(var i = 0; i < dataAsObjects.length; i++) {
            body += " -F " + dataAsObjects[i].key + "=" + dataAsObjects[i].value;
        }

        return body;
    },

    getBodyForCurl: function() {
        var dataMode = this.get("dataMode");

        if (dataMode !== "params") {
            return " -d " + this.get("dataaAsPreview");
        }
        else {
            return this.getFormDataForCurl();
        }
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

    getDataMode:function () {
        return this.get("dataMode");
    },

    loadData:function (mode, data, asObjects) {
        this.set("dataMode", mode);
        this.set("asObjects", asObjects);

        if (mode !== "raw") {
            if (asObjects) {
                this.set("data", _.clone(data));
                this.set("dataAsObjects", _.clone(data));
            }
            else {
                var params = getBodyVars(data, false);
                this.set("data", _.clone(params));
                this.set("dataAsObjects", _.clone(params));
            }
        }
        else {
            //No need for objects
            this.set("data", _.clone(data));
        }

        this.trigger("dataLoaded", this);
    }
});