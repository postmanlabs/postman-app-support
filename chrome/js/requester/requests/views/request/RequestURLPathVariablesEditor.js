var RequestURLPathVariablesEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        var editorId = "#pathvariables-keyvaleditor";
        this.editorId = editorId;

        model.on("change:url", this.onChangeUrl, this);
        model.on("startNew", this.onStartNew, this);

        var params = {
            placeHolderKey:"Path variable key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            editableKeys: false,
            onDeleteRow:function () {
                view.setUrl();
            },

            onBlurElement:function () {
                view.setUrl();
            }
        };

        $('#url').keyup(function () {
            var url = $(this).val();
            view.setEditorParams(url);
        });

        $(editorId).keyvalueeditor('init', params);
    },

    setUrl: function() {
        var params = this.getEditorParams();

        // TODO Simplify this
        this.model.set("url", $("#url").val());
        this.model.setPathVariables(params);
    },

    loadEditorParams: function(params) {
        var rows = [];
        var row;

        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                row = {
                    "key": key,
                    "value": params[key]
                }

                rows.push(row);
            }
        }

        $(this.editorId).keyvalueeditor('reset', rows);
    },

    setEditorParams: function(url) {
        var newKeys = getURLPathVariables(url);
        var currentParams = $(this.editorId).keyvalueeditor('getValues');
        var param;
        var keyExists;
        var newParams = [];
        var newParam;

        for (var i = 0; i < currentParams.length; i++) {
            param = currentParams[i];
            keyIndex = _.indexOf(newKeys, param.key);

            if (keyIndex >= 0) {
                newParams.push(param);
                newKeys.splice(keyIndex, 1);
            }
        }

        for (i = 0; i < newKeys.length; i++) {
            newParam = {
                "key": newKeys[i],
                "value": ""
            };

            newParams.push(newParam);
        }

        $(this.editorId).keyvalueeditor('reset', newParams);
    },

    onChangeUrl: function() {
        console.log("Change URL called in PathVariables");
        // Generate keyvaleditor rows
        this.setEditorParams($("#url").val());
    },

    startNew: function() {
        var newRows = [];
        $(this.editorId).keyvalueeditor('reset', newRows);
    },

    updateModel: function() {
        this.setUrl();
    },

    getEditorParams: function() {
        var params = $(this.editorId).keyvalueeditor('getValues');
        var assocParams = {};

        for (var i = 0; i < params.length; i++) {
            assocParams[params[i].key] = params[i].value;
        }

        return assocParams;
    },

    openEditor:function () {
        var containerId = "#pathvariables-keyvaleditor-container";
        $(containerId).css("display", "block");
        var val = $("#url").val();
        this.setEditorParams(val);
    },

    closeEditor:function () {
        var containerId = "#pathvariables-keyvaleditor-container";
        $(containerId).css("display", "none");
        this.updateModel();
    }
});