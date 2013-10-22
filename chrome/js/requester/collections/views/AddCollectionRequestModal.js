var AddCollectionRequestModal = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        model.on("add", this.onChanged, this);
        model.on("remove", this.onChanged, this);
        model.on("change", this.onChanged, this);

        model.on("updateCollection", this.onChanged, this);
        model.on("updateCollectionMeta", this.onChanged, this);

        model.on("addFolder", this.onChanged, this);
        model.on("updateFolder", this.onChanged, this);
        model.on("deleteFolder", this.onChanged, this);

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
            pm.app.trigger("modalOpen", "#modal-add-to-collection");

            if (!view.editor) {
                view.initializeEditor();
            }
        });

        $("#modal-add-to-collection").on("hidden", function () {
            pm.app.trigger("modalClose");
        });

        //Initialize select-collection options

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

        //TODO Fix this
        pm.addRequestToCollectionEditor = this.editor;

        this.editor.refresh();
    },

    add: function(model, pmCollection) {
        $('#select-collection').append(Handlebars.templates.item_collection_selector_list(model.toJSON()));
    },

    remove: function(model, pmCollection) {
        var collection = model.toJSON();
        $('#select-collection option[value="' + collection.id + '"]').remove();
    },

    onChanged: function() {
        var items = _.clone(this.model.toJSON());
        var folders;

        for(var i = 0; i < items.length; i++) {
            if("folders" in items[i]) {
                folders = items[i].folders;

                folders.sort(sortAlphabetical);

                for(var j = 0; j < folders.length; j++) {
                    folders[j].collection_name = items[i].name;
                    folders[j].collection_id = items[i].id;
                }
            }
        }

        $('#select-collection').html("<option>Select</option>");
        $('#select-collection').append(Handlebars.templates.collection_selector_list({items: this.model.toJSON()}));
    },

    addRequestToCollection: function() {
        var selectValue = $("#select-collection").val();
        var $option = $("#select-collection option[value='" + selectValue + "']");
        var targetType = $option.attr("data-type");

        var collectionId;
        var folderId;

        if (targetType === "collection") {
            collectionId = $option.attr("data-collection-id");
        }
        else if (targetType === "folder") {
            collectionId = $option.attr("data-collection-id");
            folderId = $option.attr("data-folder-id");
        }

        var newCollection = $("#new-collection").val();

        var collection = {};

        if (newCollection) {
            targetType = "collection";
            collection.id = guid();
            collection.name = newCollection;
        }
        else {
            collection.id = collectionId;
        }

        var newRequestName = $('#new-request-name').val();
        var newRequestDescription = this.editor.getValue();

        var model = this.model;

        pm.mediator.trigger("getRequest", function(request) {
            var body = request.get("body");

            var url = request.get("url");
            if (newRequestName === "") {
                newRequestName = url;
            }

            // TODO Get some of this from getAsJson
            var collectionRequest = {
                id: guid(),
                headers: request.getPackedHeaders(),
                url: url,
                pathVariables: request.get("pathVariables"),
                method: request.get("method"),
                data: body.get("dataAsObjects"),
                dataMode: body.get("dataMode"),
                name: newRequestName,
                description: newRequestDescription,
                descriptionFormat: "html",
                time: new Date().getTime(),
                version: 2,
                responses: []
            };

            console.log("Add request", collectionRequest);

            if (targetType === "folder") {
                model.addRequestToFolder(collectionRequest, collectionId, folderId);
            }
            else {
                model.addRequestToCollection(collectionRequest, collection);
            }
        });
    }
});