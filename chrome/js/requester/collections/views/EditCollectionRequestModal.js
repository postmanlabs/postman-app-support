var EditCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("editCollectionRequest", this.render, this);

        var view = this;

        $('#form-edit-collection-request').submit(function() {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = view.editor.getValue();
            model.updateCollectionRequestMeta(id, name, description);
            return false;
        });

        $('#modal-edit-collection-request .btn-primary').click(function () {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = view.editor.getValue();
            console.log("Update with", description);
            model.updateCollectionRequestMeta(id, name, description);
            $('#modal-edit-collection-request').modal('hide');
        });

        $("#modal-edit-collection-request").on("shown", function () {
            $("#modal-edit-collection-request .collection-request-name").focus();
            pm.app.trigger("modalOpen", "#modal-edit-collection-request");
        });

        $("#modal-edit-collection-request").on("hidden", function () {
            pm.app.trigger("modalClose");
        });
    },

    initializeEditor: function() {
        if (this.editor) {
            return;
        }

        this.editor = CodeMirror.fromTextArea(document.getElementById("collection-request-description"), {
            mode: 'markdown',
            theme: "eclipse",
            lineWrapping: true,
            lineNumbers:true,
            extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
        });

        //TODO Will be changed to something else later
        pm.editCollectionRequestEditor = this.editor;

        this.editor.refresh();
    },

    render: function(request) {
        $('#form-edit-collection-request .collection-request-id').val(request.id);
        $('#form-edit-collection-request .collection-request-name').val(request.name);
        $('#modal-edit-collection-request').modal('show');

        if (!this.editor) {
            this.initializeEditor();
        }

        var view = this;

        setTimeout(function() {
            view.editor.setValue(request.description);
            view.editor.refresh();

            CodeMirror.commands["goDocStart"](view.editor);
        }, 750);

    }
});
