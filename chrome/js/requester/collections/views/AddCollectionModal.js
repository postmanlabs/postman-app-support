var AddCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        $('#form-new-collection').submit(function () {
            var name = $('#new-collection-blank').val();
            var description = view.editor.getValue();
            model.addCollection(name, description);
            $('#new-collection-blank').val("");
            $('#modal-new-collection').modal('hide');
            return false;
        });

        $('#modal-new-collection .btn-primary').click(function () {
            var name = $('#new-collection-blank').val();
            var description = view.editor.getValue();
            model.addCollection(name, description);
            $('#new-collection-blank').val("");
            $('#modal-new-collection').modal('hide');
            return false;
        });

        $("#modal-new-collection").on("shown", function () {
            $("#new-collection-blank").focus();
            pm.app.trigger("modalOpen", "#modal-new-collection");

            if (!view.editor) {
                view.initializeEditor();
            }
        });

        $("#modal-new-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    initializeEditor: function() {
        if (this.editor) {
            return;
        }

        this.editor = CodeMirror.fromTextArea(document.getElementById("new-collection-description"), {
            mode: 'markdown',
            theme: "eclipse",
            lineWrapping: true,
            lineNumbers:true,
            extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
        });

        pm.addCollectionEditor = this.editor;

        this.editor.refresh();
    }
});
