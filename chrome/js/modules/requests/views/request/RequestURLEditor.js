var RequestURLEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        var editorId;
        editorId = "#url-keyvaleditor";

        this.editorId = editorId;

        model.on("startNew", this.onStartNew, this);

        var params = {
            placeHolderKey:"URL Parameter Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
                var params = view.getUrlEditorParams();
                model.setUrlParams(params);
                model.setUrlParamString(view.getUrlEditorParams());
            },

            onBlurElement:function () {
                var params = view.getUrlEditorParams();
                model.setUrlParams(params);
                model.setUrlParamString(view.getUrlEditorParams());
            }
        };

        $(editorId).keyvalueeditor('init', params);

        $('#url-keyvaleditor-actions-close').on("click", function () {
            view.closeUrlEditor();
        });

        $('#url-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#url-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                view.closeUrlEditor();
            }
            else {
                var newRows = getUrlVars($('#url').val(), false);
                $(editorId).keyvalueeditor('reset', newRows);
                view.openUrlEditor();
            }

        });

        $('#url').keyup(function () {
            var newRows = getUrlVars($('#url').val(), false);
            $('#url-keyvaleditor').keyvalueeditor('reset', newRows);
        });


        var urlFocusHandler = function () {
            if(pm.layout.isModalOpen) {
                return;
            }

            $('#url').focus();
            return false;
        };

        $(document).bind('keydown', 'backspace', urlFocusHandler);
    },

    onStartNew: function(model) {
        $("#url").val("");
        var newRows = [];
        $(this.editorId).keyvalueeditor('reset', newRows);
        $('#url').focus();
    },

    updateModel: function() {
        this.model.setUrlParamString(this.getUrlEditorParams());
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