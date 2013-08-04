var CollectionSidebar = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        model.on("add", this.renderOneCollection, this);
        model.on("remove", this.removeOneCollection, this);

        model.on("updateCollection", this.renderOneCollection, this);
        model.on("updateCollectionMeta", this.updateCollectionMeta, this);

        model.on("addCollectionRequest", this.addCollectionRequest, this);
        model.on("selectedCollectionRequest", this.selectedCollectionRequest, this);
        model.on("removeCollectionRequest", this.removeCollectionRequest, this);
        model.on("updateCollectionRequest", this.updateCollectionRequest, this);

        model.on("filter", this.onFilter, this);
        model.on("revertFilter", this.onRevertFilter, this);

        $('#collection-items').html("");
        $('#collection-items').append(Handlebars.templates.message_no_collection({}));

        var $collection_items = $('#collection-items');

        $collection_items.on("mouseenter", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'block');
        });

        $collection_items.on("mouseleave", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("mouseenter", ".sub-collection .sub-collection-head", function () {
            var actionsEl = jQuery('.sub-collection-head-actions', this);
            actionsEl.css('display', 'block');
        });

        $collection_items.on("mouseleave", ".sub-collection .sub-collection-head", function () {
            var actionsEl = jQuery('.sub-collection-head-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("click", ".sidebar-collection-head-name", function () {
            var id = $(this).attr('data-id');
            view.toggleRequestList(id);
        });

        $collection_items.on("click", ".sub-collection-head-name", function () {            
            var id = $(this).attr('data-id');
            view.toggleSubRequestList(id);
        });

        $collection_items.on("click", ".collection-head-actions .label", function () {
            var id = $(this).parent().parent().parent().attr('data-id');
            view.toggleRequestList(id);
        });

        $collection_items.on("click", ".collection-actions-add-sub", function () {            
            var id = $(this).attr('data-id');
            var c = model.get(id);
            model.trigger("showAddSubModal", c);
            console.log("Open the add-sub collection modal", c);
        });

        $collection_items.on("click", ".collection-actions-edit", function () {
            var id = $(this).attr('data-id');
            var c = model.get(id);
            model.trigger("showEditModal", c);
        });

        $collection_items.on("click", ".collection-actions-delete", function () {
            var id = $(this).attr('data-id');
            var name = $(this).attr('data-name');

            $('#modal-delete-collection-yes').attr('data-id', id);
            $('#modal-delete-collection-name').html(name);            
        });

        $collection_items.on("click", ".collection-actions-download", function () {
            var id = $(this).attr('data-id');

            $("#modal-share-collection").modal("show");

            $('#share-collection-get-link').attr("data-collection-id", id);
            $('#share-collection-download').attr("data-collection-id", id);
            $('#share-collection-link').css("display", "none");
        });

        $('#collection-items').on("mouseenter", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'block');
        });

        $('#collection-items').on("mouseleave", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("click", ".request-actions-load", function () {
            var id = $(this).attr('data-id');            
            model.getCollectionRequest(id);
        });

        $collection_items.on("click", ".request-actions-delete", function () {
            var id = $(this).attr('data-id');
            var request = model.getRequestById(id);
            model.trigger("deleteCollectionRequest", request);
        });

        $collection_items.on("click", ".request-actions-edit", function () {
            var id = $(this).attr('data-id');
            var request = model.getRequestById(id);            

            model.trigger("editCollectionRequest", request);
        });
    },

    selectedCollectionRequest: function(request) {
        var id = request.id;
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
        $('#sidebar-request-' + id).addClass('sidebar-collection-request-active');
    },

    addRequestListeners:function () {
        $('#sidebar-sections').on("mouseenter", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'block');
        });

        $('#sidebar-sections').on("mouseleave", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'none');
        });
    },

    emptyCollectionInSidebar:function (id) {
        $('#collection-requests-' + id).html("");
    },

    removeOneCollection:function (model, pmCollection) {
        var collection = model.toJSON();
        $('#collection-' + collection.id).remove();

        if(pmCollection.length === 0) {
            $('#sidebar-section-collections .empty-message').css("display", "block");
        }
    },

    //TODO Split this into smaller functions
    renderOneCollection:function (model, pmCollection) {
        console.log(model, pmCollection);

        var collection = model.toJSON();

        function requestFinder(request) {
            return request.id === collection["order"][j]
        }

        $('#sidebar-section-collections .empty-message').css("display", "none");

        var currentEl = $('#collection-' + collection.id);

        var collectionSidebarListPosition = -1;
        var insertionType;
        var insertTarget;

        var model = this.model;
        var view = this;
        var collections = this.model.toJSON();
        var subCollections = [];

        collectionSidebarListPosition = arrayObjectIndexOf(collections, collection.id, "id");

        // TODO Detecting insertionType: Move to a different function or simplify
        //Does this exist already?
        if (currentEl.length) {
            //Find current element list position
            if (collectionSidebarListPosition === 0) {
                insertionType = "before";
                insertTarget = $('#collection-' + collections[collectionSidebarListPosition + 1].id);                
            }
            else {
                insertionType = "after";
                insertTarget = $('#collection-' + collections[collectionSidebarListPosition - 1].id);
            }

            //Found element
            currentEl.remove();

            //TODO Will be added inside AddCollectionRequestModal
            $('#select-collection option[value="' + collection.id + '"]').remove();
        }
        else {
            //New element
            if (collectionSidebarListPosition === collections.length - 1) {
                insertionType = "append";
            }
            else {
                var nextCollectionId = collections[collectionSidebarListPosition + 1].id;
                insertTarget = $("#collection-" + nextCollectionId);

                if (insertTarget.length > 0) {
                    insertionType = "before";
                }
                else {
                    insertionType = "append";
                }
            }
        }

        if (insertionType) {
            if (insertionType === "after") {
                $(insertTarget).after(Handlebars.templates.item_collection_sidebar_head(collection));
            }
            else if (insertionType === "before") {
                $(insertTarget).before(Handlebars.templates.item_collection_sidebar_head(collection));
            }
            else {
                $("#collection-items").append(Handlebars.templates.item_collection_sidebar_head(collection));
            }
        } else {
            $("#collection-items").append(Handlebars.templates.item_collection_sidebar_head(collection));
        }

        $('a[rel="tooltip"]').tooltip();

        $('#collection-' + collection.id + " .sidebar-collection-head").droppable({
            accept: ".sidebar-collection-request",
            hoverClass: "ui-state-hover",
            drop: _.bind(this.handleRequestDropOnCollection, this)
        });

        if("sub_collections" in collection) {
            subCollections = collection["sub_collections"];
        }

        if ("requests" in collection) {
            var id = collection.id;
            var requests = collection.requests;
            var targetElement = "#collection-requests-" + id;
            var count = requests.length;
            var requestTargetElement;

            if (count > 0) {
                for (var i = 0; i < count; i++) {
                    //TODO Move this to the model
                    pm.urlCache.addUrl(requests[i].url);

                    if (typeof requests[i].name === "undefined") {
                        requests[i].name = requests[i].url;
                    }

                    requests[i].name = limitStringLineWidth(requests[i].name, 40);

                    //Make requests draggable for moving to a different collection
                    requestTargetElement = "#sidebar-request-" + requests[i].id;
                    $(requestTargetElement).draggable({});
                }

                //Sort requests as A-Z order
                // TODO This needs to be handled in the model
                var hasOrder = "order" in collection;
                if (hasOrder) {
                    hasOrder = collection.order.length !== 0;
                }

                if (!hasOrder) {
                    requests.sort(sortAlphabetical);
                }
                else {                    
                    if(collection["order"].length === requests.length) {
                        var orderedRequests = [];
                        for (var j = 0, len = collection["order"].length; j < len; j++) {
                            var element = _.find(requests, requestFinder);
                            orderedRequests.push(element);
                        }
                        requests = orderedRequests;
                    }
                }

                //Add requests to the DOM
                $(targetElement).append(Handlebars.templates.collection_sidebar({"items":requests, "sub_collections": subCollections}));


                // TODO Move this to a different function
                $(targetElement).sortable({
                    update: _.bind(view.onUpdateSortableCollectionRequestList, view)
                });
            }

        }
    },

    onUpdateSortableCollectionRequestList: function(event, ui) {
        var pmCollection = this.model;

        var target_parent = $(event.target).parents(".sidebar-collection-requests");
        var target_parent_collection = $(event.target).parents(".sidebar-collection");
        var collection_id = $(target_parent_collection).attr("data-id");
        var ul_id = $(target_parent.context).attr("id");
        var collection_requests = $(target_parent.context).children("li");
        var count = collection_requests.length;
        var order = [];

        for (var i = 0; i < count; i++) {
            var li_id = $(collection_requests[i]).attr("id");
            var request_id = $("#" + li_id + " .request").attr("data-id");
            order.push(request_id);
        }

        pmCollection.updateCollectionOrder(collection_id, order);
    },

    updateCollectionMeta: function(collection) {
        var id = collection.id;

        var currentClass = $("#collection-" + id + " .sidebar-collection-head-dt").attr("class");
        var collectionHeadHtml = '<span class="sidebar-collection-head-dt"><img src="img/dt.png"/></span>';
        collectionHeadHtml += " " + collection.name;

        $('#collection-' + collection.id + " .sidebar-collection-head-name").html(collectionHeadHtml);
        $('#select-collection option[value="' + collection.id + '"]').html(collection.name);

        if(currentClass.indexOf("open") >= 0) {
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");
        }
        else {
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-close");
        }
    },

    addCollectionRequest: function(request) {
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
        var targetElement = "#collection-requests-" + request.collectionId;
        $('#sidebar-request-' + request.id).addClass('sidebar-collection-request-active');

        $('#sidebar-request-' + request.id).draggable({});

        pm.urlCache.addUrl(request.url);

        if (typeof request.name === "undefined") {
            request.name = request.url;
        }

        request.name = limitStringLineWidth(request.name, 43);

        $(targetElement).append(Handlebars.templates.item_collection_sidebar_request(request));

        request.isFromCollection = true;
        request.collectionRequestId = request.id;
        
        $('#collection-' + request.collectionId + " .sidebar-collection-head").droppable({
            accept: ".sidebar-collection-request",
            hoverClass: "ui-state-hover",
            drop: _.bind(this.handleRequestDropOnCollection, this)
        });

        this.openCollection(request.collectionId);

        pm.request.loadRequestInEditor(request);
    },

    removeCollectionRequest: function(request) {
        $('#sidebar-request-' + request.id).remove();
    },

    updateCollectionRequest: function(request) {
        var requestName;
        requestName = limitStringLineWidth(request.name, 43);
        $('#sidebar-request-' + request.id + " .request .request-name").html(requestName);
        $('#sidebar-request-' + request.id + " .request .label").html(request.method);
        $('#sidebar-request-' + request.id + " .request .label").addClass('label-method-' + request.method);

        noty({
            type:'success',
            text:'Saved request',
            layout:'topCenter',
            timeout:750
        });
    },

    openCollection:function (id) {
        var target = "#collection-requests-" + id;
        $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-close");
        $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");

        if ($(target).css("display") === "none") {
            $(target).slideDown(100, function () {
            });
        }
    },

    toggleRequestList:function (id) {
        var target = "#collection-requests-" + id;
        if ($(target).css("display") === "none") {
            $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-close");
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-open");

            $(target).slideDown(100, function () {
            });
        }
        else {
            $("#collection-" + id + " .sidebar-collection-head-dt").removeClass("disclosure-triangle-open");
            $("#collection-" + id + " .sidebar-collection-head-dt").addClass("disclosure-triangle-close");
            $(target).slideUp(100, function () {
            });
        }
    },

    toggleSubRequestList: function(id) {
        var target = "#sub-collection-requests-" + id;
        console.log(target, $(target));

        if ($(target).css("display") === "none") {
            $("#sub-collection-" + id + " .sub-collection-head-dt").removeClass("disclosure-triangle-close");
            $("#sub-collection-" + id + " .sub-collection-head-dt").addClass("disclosure-triangle-open");

            $(target).slideDown(100, function () {
            });
        }
        else {
            $("#sub-collection-" + id + " .sub-collection-head-dt").removeClass("disclosure-triangle-open");
            $("#sub-collection-" + id + " .sub-collection-head-dt").addClass("disclosure-triangle-close");
            $(target).slideUp(100, function () {
            });
        }
    },

    handleRequestDropOnCollection: function(event, ui) {
        var id = ui.draggable.context.id;
        var requestId = $('#' + id + ' .request').attr("data-id");
        var targetCollectionId = $($(event.target).find('.sidebar-collection-head-name')[0]).attr('data-id');
        this.model.dropRequestOnCollection(requestId, targetCollectionId);
    },

    onFilter: function(filteredCollectionItems) {
        var collectionsCount = filteredCollectionItems.length;
        for(var i = 0; i < collectionsCount; i++) {
            var c = filteredCollectionItems[i];
            var collectionDomId = "#collection-" + c.id;
            var collectionRequestsDomId = "#collection-requests-" + c.id;
            var dtDomId = "#collection-" + c.id + " .sidebar-collection-head-dt";

            if(c.toShow) {
                $(collectionDomId).css("display", "block");
                $(collectionRequestsDomId).css("display", "block");
                $(dtDomId).removeClass("disclosure-triangle-close");
                $(dtDomId).addClass("disclosure-triangle-open");

                var requests = c.requests;
                if(requests) {
                    var requestsCount = requests.length;
                    for(var j = 0; j < requestsCount; j++) {
                        var r = requests[j];
                        var requestDomId = "#sidebar-request-" + r.id;
                        if(r.toShow) {
                            $(requestDomId).css("display", "block");
                        }
                        else {
                            $(requestDomId).css("display", "none");
                        }
                    }
                }
            }
            else {
                $(collectionDomId).css("display", "none");
                $(collectionRequestsDomId).css("display", "none");
                $(dtDomId).removeClass("disclosure-triangle-open");
                $(dtDomId).addClass("disclosure-triangle-close");
            }
        }
    },

    onRevertFilter: function() {
        $(".sidebar-collection").css("display", "block");
        $(".sidebar-collection-request").css("display", "block");        
    }
});