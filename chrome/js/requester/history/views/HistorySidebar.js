var HistorySidebar = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        //Event: Load all
        //Event: Add request
        this.model.on("reset", this.render, this);
        this.model.on("add", this.addOne, this);
        this.model.on("remove", this.removeOne, this);

        this.model.on("filter", this.onFilter, this);
        this.model.on("revertFilter", this.onRevertFilter, this);
        //Event: Delete request


        $('.history-actions-delete').click(function () {
            model.clear();
        });

        $('#history-items').on("click", ".request-actions-delete", function () {
            var request_id = $(this).attr('data-request-id');
            model.deleteRequest(request_id);
        });

        $('#history-items').on("click", ".request", function () {
            var request_id = $(this).attr('data-request-id');
            model.loadRequest(request_id);
        });

        $('#history-items').on("mouseenter", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'block');
        });

        $('#history-items').on("mouseleave", ".sidebar-request", function () {
            var actionsEl = jQuery('.request-actions', this);
            actionsEl.css('display', 'none');
        });

        var clearHistoryHandler = function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            pm.history.clear();
            return false;
        };

        $(document).bind('keydown', 'alt+c', clearHistoryHandler);

        this.showEmptyMessage();
    },

    addOne: function(model, collection) {
        var request = model.toJSON();

        var displayUrl = _.clone(request.url);
        var method = request.method;
        var id = request.id;
        var position = request.position;

        if (displayUrl.length > 80) {
            displayUrl = displayUrl.substring(0, 80) + "...";
        }

        displayUrl = limitStringLineWidth(displayUrl, 40);

        var request = {
            url:displayUrl,
            method:method,
            id:id,
            position:position
        };

        if (position === "top") {
            $('#history-items').prepend(Handlebars.templates.item_history_sidebar_request(request));
        }
        else {
            $('#history-items').append(Handlebars.templates.item_history_sidebar_request(request));
        }

        this.hideEmptyMessage();
    },

    showEmptyMessage:function () {
        $('#history-items').append(Handlebars.templates.message_no_history());
    },

    hideEmptyMessage:function () {
        $('#history-items .empty-message').remove();
    },

    removeOne:function (model, collection) {
        var historyRequest = model.toJSON();
        var id = historyRequest.id;

        $("#sidebar-request-" + model.id).remove();

        var requests = collection.toJSON();

        if (requests.length === 0) {
            this.showEmptyMessage();
        }
        else {
            this.hideEmptyMessage();
        }
    },

    render: function() {
        var requests = this.model.toJSON();

        if (requests.length === 0) {
            $('#history-items').html("");
            this.showEmptyMessage();
        }
        else {
            this.hideEmptyMessage();
            $('#history-items').append(Handlebars.templates.history_sidebar_requests({"items":requests}));
            $('#history-items').fadeIn();
        }
    },

    onFilter: function(filteredHistoryItems) {
        var count = filteredHistoryItems.length;
        for(var i = 0; i < count; i++) {
            var item = filteredHistoryItems[i];
            var id = "#sidebar-request-" + item.id;

            if(item.toShow) {
                $(id).css("display", "block");
            }
            else {
                $(id).css("display", "none");
            }
        }
    },

    onRevertFilter: function() {
        $("#history-items li").css("display", "block");
    }
});