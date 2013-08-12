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