var RequestBodyURLEncodedEditor = Backbone.View.extend({
    initialize: function() {
        this.model.on("startNew", this.onStartNew, this);

        var body = this.model.get("body");
        body.on("change:dataAsObjects", this.onChangeBodyData, this);

        var editorId = "#urlencoded-keyvaleditor";

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            valueTypes:["text"],
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
            },

            onBlurElement:function () {
            }
        };

        $(editorId).keyvalueeditor('init', params);
    },

    onStartNew: function() {
        $('#urlencoded-keyvaleditor').keyvalueeditor('reset');
    },

    onChangeBodyData: function() {
        var body = this.model.get("body");
        var mode = body.get("dataMode");
        var asObjects = body.get("asObjects");
        var data = body.get("dataAsObjects");

        if (mode === "urlencoded") {
            if (data) {
                try {
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', data);
                }
                catch(e) {
                    console.log(e);
                }
            }

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

                if (pm.settings.getSetting("trimKeysAndValues")) {
                    console.log("Trim value", value);
                    value = $.trim(value);
                }

                value = pm.envManager.getCurrentValue(value);
                value = encodeURIComponent(value);
                value = value.replace(/%20/g, '+');
                key = encodeURIComponent(row.keyElement.val());
                key = key.replace(/%20/g, '+');

                if (pm.settings.getSetting("trimKeysAndValues")) {
                    key = $.trim(key);
                }

                urlEncodedBodyData += key + "=" + value + "&";
            }

            urlEncodedBodyData = urlEncodedBodyData.substr(0, urlEncodedBodyData.length - 1);

            return urlEncodedBodyData;
        }
        else {
            return false;
        }
    }
});