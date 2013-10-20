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
        var value;

        var body = "";
        for(var i = 0; i < dataAsObjects.length; i++) {
            value = pm.envManager.getCurrentValue(dataAsObjects[i].value);
            body += " -F " + dataAsObjects[i].key + "=" + value;
        }

        return body;
    },

    getBodyForCurl: function() {
        var dataMode = this.get("dataMode");
        var preview;

        if (dataMode !== "params") {
            preview = pm.envManager.getCurrentValue(this.get("dataAsPreview"));
            return " -d '" + preview + "'";
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
                if (mode === "params") {
                    // Change made through an event in RequestBodyFormDataEditor
                    this.set("dataAsObjects", _.clone(data));
                }
                else {
                    this.set("data", _.clone(data));
                    this.set("dataAsObjects", _.clone(data));
                }
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