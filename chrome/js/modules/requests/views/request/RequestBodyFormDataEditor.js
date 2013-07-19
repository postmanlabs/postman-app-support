var RequestBodyFormDataEditor = Backbone.View.extend({
    initialize: function() {
        this.model.on("startNew", this.onStartNew, this);

        var body = this.model.get("body");
        body.on("change:dataAsObjects", this.onChangeBodyData, this);

        var editorId = "#formdata-keyvaleditor";

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            valueTypes:["text", "file"],
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
            },

            onBlurElement:function () {
            }
        };

        $(editorId).keyvalueeditor('init', params);
    },

    onStartNew: function() {
        $('#formdata-keyvaleditor').keyvalueeditor('reset');
    },

    onChangeBodyData: function() {
        var body = this.model.get("body");
        var mode = body.get("dataMode");
        var asObjects = body.get("asObjects");
        var data = body.get("dataAsObjects");

        console.log("Set FormDataEditor data", mode, data);

        if (mode === "params") {
            if (data) {
                try {
                    $('#formdata-keyvaleditor').keyvalueeditor('reset', data);        
                }
                catch(e) {
                    console.log(e);
                }
                
            }            
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
    }
});