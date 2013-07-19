var HistorySidebar = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        //Event: Load all
        //Event: Add request
        this.model.on("reset", this.render, this);
        this.model.on("add", this.addOne, this);
        this.model.on("remove", this.removeOne, this);
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

        this.showEmptyMessage();
    },

    addOne: function(model, collection) {
        var request = model.toJSON();

        var url = request.url;
        var method = request.method;
        var id = request.id;
        var position = request.position;

        if (url.length > 80) {
            url = url.substring(0, 80) + "...";
        }

        url = limitStringLineWidth(url, 40);

        var request = {
            url:url,
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

        pm.urlCache.addUrl(request.url);

        this.hideEmptyMessage();
    },

    showEmptyMessage:function () {
        $('#history-items').append(Handlebars.templates.message_no_history());
    },

    hideEmptyMessage:function () {
        $('#history-items .empty-message').remove();
    },

    removeOne:function (model, collection) {
        console.log("Remove one called");

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
        console.log("Render history");

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
    }
});