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
            pm.app.onModalOpen("#modal-add-to-collection");

            if (!view.editor) {
                view.initializeEditor();    
            }            
        });

        $("#modal-add-to-collection").on("hidden", function () {
            pm.app.onModalClose();
        });

        //Initialize select-collection options
        $('#select-collection').html("<option>Select</option>");

        $(document).bind('keydown', 'a', function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            $('#modal-add-to-collection').modal({
                keyboard:true,
                backdrop:"static"
            });

            $('#modal-add-to-collection').modal('show');
            return false;
        });
    },

    initializeEditor: function() {
        if (this.editor) {
            return;
        }

        this.editor = CodeMirror.fromTextArea(document.getElementById("new-request-description"), {
            mode: 'markdown',
            theme: "eclipse",
            lineWrapping: true,
            lineNumbers:true,
            extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
        });

        this.editor.refresh();
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
        var newRequestDescription = this.editor.getValue();
        var model = pm.request;
        var body = model.get("body");

        var url = model.get("url");
        if (newRequestName === "") {
            newRequestName = url;
        }

        var collectionRequest = {};
        collectionRequest.id = guid();
        collectionRequest.headers = model.getPackedHeaders();
        collectionRequest.url = url;
        collectionRequest.method = model.get("method");
        collectionRequest.data = body.get("dataAsObjects");
        collectionRequest.dataMode = body.get("dataMode");
        collectionRequest.name = newRequestName;
        collectionRequest.description = newRequestDescription;
        collectionRequest.descriptionFormat = "html";
        collectionRequest.time = new Date().getTime();        
        collectionRequest.version = 2;

        collectionRequest.responses = [];

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