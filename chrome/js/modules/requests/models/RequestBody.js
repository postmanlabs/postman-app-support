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
        return this.get("mode");
    },

    loadData:function (mode, data, asObjects) {
        console.log("Load body", mode, data, asObjects);

        this.set("mode", mode);
        this.set("asObjects", asObjects);

        if (mode !== "raw") {
            if (!asObjects) {
                var params = getBodyVars(data, false);
                this.set("data", params);
            }
            else {
                this.set("data", data);
            }
        }
        else {
            this.set("data", data);
        }

        this.trigger("dataLoaded", this);
    }
});