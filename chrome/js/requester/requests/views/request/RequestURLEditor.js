var RequestURLEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        var editorId;
        editorId = "#url-keyvaleditor";

        this.editorId = editorId;

        model.on("change:url", this.onChangeUrl, this);
        model.on("updateURLInputText", this.onUpdateURLInputText, this);
        model.on("startNew", this.onStartNew, this);
        model.on("customURLParamUpdate", this.onCustomUrlParamUpdate, this);

        var params = {
            placeHolderKey:"URL Parameter Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
                var params = view.getUrlEditorParams();
                // TODO Simplify this
                model.set("url", $("#url").val());
                model.setUrlParams(params);
                model.setUrlParamString(view.getUrlEditorParams(), true);
            },

            onBlurElement:function () {
                var params = view.getUrlEditorParams();
                model.set("url", $("#url").val());
                model.setUrlParams(params);
                model.setUrlParamString(view.getUrlEditorParams(), true);
            }
        };

        $(editorId).keyvalueeditor('init', params);

        $('#url').keyup(function () {
            var newRows = getUrlVars($('#url').val(), false);
            $('#url-keyvaleditor').keyvalueeditor('reset', newRows);
        });


        var urlFocusHandler = function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            $('#url').focus();
            return false;
        };

        try {
            $("#url").autocomplete({
                source: pm.urlCache.getUrls(),
                delay: 50
            });
        }
        catch(e) {

        }

        $(document).bind('keydown', 'backspace', urlFocusHandler);
    },

    onCustomUrlParamUpdate: function() {
        this.openUrlEditor();
    },

    onUpdateURLInputText: function() {
        var url = this.model.get("url");
        $("#url").val(url);
    },

    onChangeUrl: function() {
        var url = this.model.get("url");
        $("#url").val(url);

        var newRows = getUrlVars(url, false);
        $('#url-keyvaleditor').keyvalueeditor('reset', newRows);
    },

    onStartNew: function(model) {
        $("#url").val("");
        var newRows = [];
        $(this.editorId).keyvalueeditor('reset', newRows);
        $('#url').focus();
    },

    updateModel: function() {
        this.model.set("url", $("#url").val());
        this.model.setUrlParamString(this.getUrlEditorParams(), true);
    },

    openAndInitUrlEditor: function() {
        var newRows = getUrlVars($('#url').val(), false);
        $("#url-keyvaleditor").keyvalueeditor('reset', newRows);
        this.openUrlEditor();
    },

    openUrlEditor:function () {
        $('#url-keyvaleditor-actions-open').addClass("active");
        var containerId = "#url-keyvaleditor-container";
        $(containerId).css("display", "block");
    },

    closeUrlEditor:function () {
        $('#url-keyvaleditor-actions-open').removeClass("active");
        var containerId = "#url-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    getUrlEditorParams:function () {
        var editorId = "#url-keyvaleditor";
        var params = $(editorId).keyvalueeditor('getValues');
        var newParams = [];
        for (var i = 0; i < params.length; i++) {
            var param = {
                key:params[i].key,
                value:params[i].value
            };

            newParams.push(param);
        }

        return newParams;
    }
});