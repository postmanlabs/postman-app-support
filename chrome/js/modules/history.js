var HistoryRequest = Backbone.Model.extend({
    defaults: function() {
        return {
        };
    }
});

var History = Backbone.Collection.extend({
    model: HistoryRequest,

    initialize: function() {
        var collection = this;

        pm.indexedDB.getAllRequestItems(function (historyRequests) {
            var outAr = [];
            var count = historyRequests.length;

            if (count === 0) {
                historyRequests = [];
            }
            else {
                for (var i = 0; i < count; i++) {
                    var r = historyRequests[i];
                    pm.urlCache.addUrl(r.url);

                    var request = r;
                    request.position = "top";

                    outAr.push(request);
                }
            }

            collection.add(outAr, {merge: true});
        });
    },

    requestExists:function (request) {
        var index = -1;
        var method = request.method.toLowerCase();

        if (pm.request.isMethodWithBody(method)) {
            return -1;
        }

        var requests = this.toJSON();
        var len = requests.length;

        for (var i = 0; i < len; i++) {
            var r = requests[i];
            if (r.url.length !== request.url.length ||
                r.headers.length !== request.headers.length ||
                r.method !== request.method) {
                index = -1;
            }
            else {
                if (r.url === request.url) {
                    if (r.headers === request.headers) {
                        index = i;
                    }
                }
            }

            if (index >= 0) {
                break;
            }
        }

        return index;
    },

    loadRequest:function (id) {
        var request = this.get(id).toJSON();
        pm.request.loadRequestInEditor(request);

        //TODO Trigger event
        $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
    },

    addRequest:function (url, method, headers, data, dataMode) {
        var id = guid();
        var maxHistoryCount = pm.settings.getSetting("historyCount");
        var requests = this.toJSON();
        var requestsCount = requests.length;

        var collection = this;

        if(maxHistoryCount > 0) {
            if (requestsCount >= maxHistoryCount) {
                //Delete the last request
                var lastRequest = requests[0];
                this.deleteRequest(lastRequest.id);
            }
        }

        var historyRequest = {
            "id":id,
            "url":url.toString(),
            "method":method.toString(),
            "headers":headers.toString(),
            "data":data,
            "dataMode":dataMode.toString(),
            "timestamp":new Date().getTime(),
            "version": 2
        };

        var index = this.requestExists(historyRequest);

        if (index >= 0) {
            var deletedId = requests[index].id;
            this.deleteRequest(deletedId);
        }

        pm.indexedDB.addRequest(historyRequest, function (request) {
            var historyRequestModel = new HistoryRequest(request);
            historyRequestModel.set("position", "top");
            collection.add(historyRequestModel);
        });
    },


    deleteRequest:function (id) {
        var collection = this;

        pm.indexedDB.deleteRequest(id, function (request_id) {
            collection.remove(request_id);
        });
    },

    clear:function () {
        var collection = this;
        pm.indexedDB.deleteHistory(function () {
            collection.reset([]);
        });
    },

    filter: function(term) {
        var requests = this.toJSON();

        var count = requests.length;
        var filteredItems = [];
        for (var i = 0; i < count; i++) {
            var id = requests[i].id;
            var url = requests[i].url;

            var filteredItem = {
                id: id,
                url: url,
                toShow: false
            };
            url = url.toLowerCase();
            if (url.indexOf(term) >= 0) {
                filteredItem.toShow = true;
            }
            else {
                filteredItem.toShow = false;
            }

            filteredItems.push(filteredItem);
        }

        return filteredItems;
    }
});

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

        this.showEmptyMessage();
    },

    addOne: function(model, collection) {
        console.log("Add one called");

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