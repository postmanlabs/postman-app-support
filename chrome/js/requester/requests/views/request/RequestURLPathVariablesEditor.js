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
            onDeleteRow:function () {

            },

            onBlurElement:function () {

            }
        };

        $(editorId).keyvalueeditor('init', params);
    },

    openEditor:function () {
        var containerId = "#pathvariables-keyvaleditor-container";
        $(containerId).css("display", "block");
    },

    closeEditor:function () {
        var containerId = "#pathvariables-keyvaleditor-container";
        $(containerId).css("display", "none");
    }
});