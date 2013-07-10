var AddCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        $('#form-new-collection').submit(function () {
            var name = $('#new-collection-blank').val();
            model.addCollection(name);
            $('#new-collection-blank').val("");
            $('#modal-new-collection').modal('hide');
            return false;
        });

        $('#modal-new-collection .btn-primary').click(function () {
            var name = $('#new-collection-blank').val();
            model.addCollection(name);
            $('#new-collection-blank').val("");
            $('#modal-new-collection').modal('hide');
            return false;
        });

        $("#modal-new-collection").on("shown", function () {
            $("#new-collection-blank").focus();
            pm.layout.onModalOpen("#modal-new-collection");
        });

        $("#modal-new-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function() {

    }
});

var EditCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("showEditModal", this.render, this);

        $('#edit-collection-update-drive').on("click", function() {
            var id = $(this).attr('data-collection-id');
            console.log("Run change queue");
            pm.drive.fetchChanges();
        });

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
            model.updateCollectionMeta(id, name);
            $('#modal-edit-collection').modal('hide');
        });

        $("#modal-edit-collection").on("shown", function () {
            $("#modal-edit-collection .collection-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection");
        });

        $("#modal-edit-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function(c) {
        console.log(event, c);
        var collection = c.toJSON();

        $('#form-edit-collection .collection-id').val(collection.id);
        $('#form-edit-collection .collection-name').val(collection.name);

        $('#modal-edit-collection').modal('show');
    }
});

var AddCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        this.model.on("add", this.add, this);
        this.model.on("remove", this.remove, this);

        var view = this;

        $('#form-add-to-collection').submit(function () {
            _.bind(this.addRequestToCollection, view)();
            $('#modal-add-to-collection').modal('hide');
            $('#new-collection').val("");
        });

        $('#modal-add-to-collection .btn-primary').click(function () {
            _.bind(view.addRequestToCollection, view)();
            $('#modal-add-to-collection').modal('hide');
            $('#new-collection').val("");
        });

        $("#modal-add-to-collection").on("shown", function () {
            $("#select-collection").focus();
            pm.layout.onModalOpen("#modal-add-to-collection");
        });

        $("#modal-add-to-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        //Initialize select-collection options
        $('#select-collection').html("<option>Select</option>");
    },

    add: function(model, pmCollection) {
        $('#select-collection').append(Handlebars.templates.item_collection_selector_list(model.toJSON()));
    },

    remove: function(model, pmCollection) {
        var collection = model.toJSON();
        $('#select-collection option[value="' + collection.id + '"]').remove();
    },

    addRequestToCollection: function() {
        var existingCollectionId = $('#select-collection').val();
        var newCollection = $("#new-collection").val();
        var newRequestName = $('#new-request-name').val();
        var newRequestDescription = $('#new-request-description').val();

        var url = $('#url').val();
        if (newRequestName === "") {
            newRequestName = url;
        }

        var collectionRequest = {};
        collectionRequest.id = guid();
        collectionRequest.headers = pm.request.getPackedHeaders();
        collectionRequest.url = url;
        collectionRequest.method = pm.request.method;
        collectionRequest.data = pm.request.body.getData(true);
        collectionRequest.dataMode = pm.request.dataMode;
        collectionRequest.name = newRequestName;
        collectionRequest.description = newRequestDescription;
        collectionRequest.time = new Date().getTime();
        collectionRequest.version = 2;
        collectionRequest.responses = pm.request.responses;

        var collection = {};

        if (newCollection) {
            collection.id = guid();
            collection.name = newCollection;
        }
        else {
            collection.id = existingCollectionId;
        }

        this.model.addRequestToCollection(collectionRequest, collection);
        this.model.trigger("displayCollectionDetails", collectionRequest);
    }

});

var EditCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("editCollectionRequest", this.render, this);

        $('#form-edit-collection-request').submit(function() {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();
            model.updateCollectionRequestMeta(id, name, description);
            return false;
        });

        $('#modal-edit-collection-request .btn-primary').click(function () {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();
            model.updateCollectionRequestMeta(id, name, description);
            $('#modal-edit-collection-request').modal('hide');
        });

        $("#modal-edit-collection-request").on("shown", function () {
            $("#modal-edit-collection-request .collection-request-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection-request");
        });

        $("#modal-edit-collection-request").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function(request) {
        $('#form-edit-collection-request .collection-request-id').val(request.id);
        $('#form-edit-collection-request .collection-request-name').val(request.name);
        $('#form-edit-collection-request .collection-request-description').html(request.description);
        $('#modal-edit-collection-request').modal('show');
    }
});

var DeleteCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        $('#modal-delete-collection-yes').on("click", function () {
            var id = $(this).attr('data-id');
            model.deleteCollection(id, true);
        });

        $("#modal-delete-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-delete-collection");
        });

        $("#modal-delete-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function() {

    }
});

var DeleteCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("deleteCollectionRequest", this.render, this);

        $('#modal-delete-collection-request-yes').on("click", function () {
            var id = $(this).attr('data-id');
            model.deleteCollectionRequest(id);
        });
    },

    render: function(request) {
        $('#modal-delete-collection-request-yes').attr('data-id', request.id);
        $('#modal-delete-collection-request-name').html(request.name);
        $('#modal-delete-collection-request').modal('show');
    }
});

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
            pm.layout.onModalOpen("#modal-import-collection");
        });

        $("#modal-import-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    addAlert: function(message) {
        $('.modal-import-alerts').append(Handlebars.templates.message_collection_added(message));
    }
});

var ShareCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        $('#share-collection-get-link').on("click", function () {
            var id = $(this).attr('data-collection-id');
            model.uploadCollection(id, function (link) {
                $('#share-collection-link').css("display", "block");
                $('#share-collection-link').html(link);
            });
        });

        $('#share-collection-download').on("click", function () {
            var id = $(this).attr('data-collection-id');
            model.saveCollection(id);
        });

        $("#modal-share-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-share-collection");
        });

        $("#modal-share-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    render: function() {

    }
});

var OverwriteCollectionModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("overwriteCollection", this.render, this);

        $('#modal-overwrite-collection-overwrite').on("click", function () {
            var originalCollectionId = model.originalCollectionId;
            var toBeImportedCollection = model.toBeImportedCollection;

            model.overwriteCollection(originalCollectionId, toBeImportedCollection);
        });

        $('#modal-overwrite-collection-duplicate').on("click", function () {
            var originalCollectionId = model.originalCollectionId;
            var toBeImportedCollection = model.toBeImportedCollection;

            model.duplicateCollection(toBeImportedCollection);
        });
    },

    render: function(collection) {
        $("#modal-overwrite-collection-name").html(collection.name);
        $("#modal-overwrite-collection-overwrite").attr("data-collection-id", collection.id);
        $("#modal-overwrite-collection-duplicate").attr("data-collection-id", collection.id);
        $("#modal-overwrite-collection").modal("show");
    }
});

var CollectionRequestDetailsView = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("displayCollectionRequest", this.show, this);
        model.on("updateCollectionRequest", this.render, this);

        $('#request-samples').on("click", ".sample-response-name", function () {
            var id = $(this).attr("data-id");
            model.loadResponseInEditor(id);
        });

        $('#request-samples').on("click", ".sample-response-delete", function () {
            var id = $(this).attr("data-id");
            model.removeSampleResponse(id);
        });

        $('.request-meta-actions-togglesize').on("click", function () {
            var action = $(this).attr('data-action');

            if (action === "minimize") {
                $(this).attr("data-action", "maximize");
                $('.request-meta-actions-togglesize img').attr('src', 'img/circle_plus.png');
                $("#request-description-container").slideUp(100);
            }
            else {
                $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');
                $(this).attr("data-action", "minimize");
                $("#request-description-container").slideDown(100);
            }
        });

        $('#request-meta').on("mouseenter", function () {
            $('.request-meta-actions').css("display", "block");
        });

        $('#request-meta').on("mouseleave", function () {
            $('.request-meta-actions').css("display", "none");
        });
    },

    show: function() {
        pm.layout.sidebar.select("collections");
        $('#request-meta').css("display", "block");
        $('#request-name').css("display", "block");
        $('#request-description').css("display", "block");

        //TODO Move this to the global Sidebar view
        $('#sidebar-selectors a[data-id="collections"]').tab('show');
    },


    render: function(request) {
        if (pm.request.collectionRequestId === request.id) {
            $('#request-name').html(request.name);
            $('#request-description').html(request.description);
        }
    }
});