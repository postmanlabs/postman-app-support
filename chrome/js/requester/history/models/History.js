var HistoryRequest = Backbone.Model.extend({
    defaults: function() {
        return {
        };
    }
});

var History = Backbone.Collection.extend({
    model: HistoryRequest,

    initialize: function() {
        var model = this;

        pm.indexedDB.getAllRequestItems(function (historyRequests) {
            var outAr = [];
            var count = historyRequests.length;

            if (count === 0) {
                historyRequests = [];
            }
            else {
                for (var i = 0; i < count; i++) {
                    var r = historyRequests[i];
                    pm.mediator.trigger("addToURLCache", r.url);

                    var request = r;
                    request.position = "top";

                    outAr.push(request);
                }
            }

            model.add(outAr, {merge: true});
        });
    },

    requestExists:function (request) {
        var index = -1;
        var method = request.method.toLowerCase();

        if (pm.methods.isMethodWithBody(method)) {
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
        pm.mediator.trigger("loadRequest", request, false, false);
        this.trigger("loadRequest");
    },

    addRequestFromJSON: function(requestJSON) {
        request = JSON.parse(requestJSON);
        this.addRequest(request.url, request.method, request.headers, request.data, request.dataMode);
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
            pm.mediator.trigger("addToURLCache", request.url);
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

        this.trigger("filter", filteredItems);

        return filteredItems;
    },

    revert: function() {
        this.trigger("revertFilter");
    }
});
