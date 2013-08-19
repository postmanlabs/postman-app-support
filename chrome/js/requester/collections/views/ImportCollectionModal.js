var ImportCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("importCollection", this.addAlert, this);

        $('#import-collection-url-submit').on("click", function () {
            var url = $('#import-collection-url-input').val();
            model.importCollectionFromUrl(url);
        });

        var dropZone = document.getElementById('import-collection-dropzone');
        dropZone.addEventListener('dragover', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        }, false);

        dropZone.addEventListener('drop', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var files = evt.dataTransfer.files; // FileList object.

            model.importCollections(files);
        }, false);

        $('#collection-files-input').on('change', function (event) {
            var files = event.target.files;
            model.importCollections(files);
            $('#collection-files-input').val("");
        });

        $("#modal-import-collection").on("shown", function () {
            pm.app.trigger("modalOpen", "#modal-import-collection");
        });

        $("#modal-import-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });

        pm.mediator.on("failedCollectionImport", function() {
            noty(
                {
                    type:'error',
                    text:'Failed importing collection. Check your file',
                    layout:'topCenter',
                    timeout:750
                });
        });
    },

    addAlert: function(message) {
        $('.modal-import-alerts').append(Handlebars.templates.message_collection_added(message));
    }
});