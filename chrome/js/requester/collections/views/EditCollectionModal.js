var EditCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        model.on("showEditModal", this.render, this);

        $('#form-edit-collection').submit(function() {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();
            model.updateCollectionMeta(id, name);
            $('#modal-edit-collection').modal('hide');
            return false;
        });

        $('#modal-edit-collection .btn-primary').click(function () {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();
            var description = view.editor.getValue();
            model.updateCollectionMeta(id, name, description);
            $('#modal-edit-collection').modal('hide');
        });

        $("#modal-edit-collection").on("shown", function () {
            $("#modal-edit-collection .collection-name").focus();
            pm.app.trigger("modalOpen", "#modal-edit-collection");
        });

        $("#modal-edit-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    initializeEditor: function() {
        if (this.editor) {
            return;
        }

        this.editor = CodeMirror.fromTextArea(document.getElementById("edit-collection-description"), {
            mode: 'markdown',
            theme: "eclipse",
            lineWrapping: true,
            lineNumbers:true,
            extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
        });

        pm.editCollectionEditor = this.editor;

        this.editor.refresh();
    },

    render: function(c) {
        var collection = c.toJSON();

        $('#form-edit-collection .collection-id').val(collection.id);
        $('#form-edit-collection .collection-name').val(collection.name);

        $('#modal-edit-collection').modal('show');

        if (!this.editor) {
            this.initializeEditor();
        }

        var view = this;

        setTimeout(function() {
            view.editor.setValue(collection.description);
            view.editor.refresh();

            CodeMirror.commands["goDocStart"](view.editor);
        }, 750);
    }
});