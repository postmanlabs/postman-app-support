pm.history = {
    requests:{},

    init:function () {
        $('.history-actions-delete').click(function () {
            pm.history.clear();
        });
    },

    showEmptyMessage:function () {
        $('#emptyHistoryMessage').css("display", "block");
    },

    hideEmptyMessage:function () {
        $('#emptyHistoryMessage').css("display", "none");
    },

    requestExists:function (request) {
        var index = -1;
        var method = request.method.toLowerCase();

        if (pm.request.isMethodWithBody(method)) {
            return -1;
        }

        var requests = this.requests;
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

    getAllRequests:function () {
        pm.indexedDB.getAllRequestItems(function (historyRequests) {
            var outAr = [];
            var count = historyRequests.length;

            if (count === 0) {
                $('#sidebar-section-history').append(Handlebars.templates.message_no_history({}));
            }
            else {
                for (var i = 0; i < count; i++) {
                    var r = historyRequests[i];
                    pm.urlCache.addUrl(r.url);

                    var url = historyRequests[i].url;

                    if (url.length > 80) {
                        url = url.substring(0, 80) + "...";
                    }

                    url = limitStringLineWidth(url, 40);

                    var request = {
                        url:url,
                        method:historyRequests[i].method,
                        id:historyRequests[i].id,
                        position:"top"
                    };

                    outAr.push(request);
                }

                outAr.reverse();

                $('#history-items').append(Handlebars.templates.history_sidebar_requests({"items":outAr}));
                $('#history-items').fadeIn();
            }

            pm.history.requests = historyRequests;
            pm.layout.refreshScrollPanes();
        });

    },

    loadRequest:function (id) {
        pm.indexedDB.getRequest(id, function (request) {
            pm.request.isFromCollection = false;
            $('.sidebar-collection-request').removeClass('sidebar-collection-request-active');
            pm.request.loadRequestInEditor(request);
        });
    },

    addRequest:function (url, method, headers, data, dataMode) {        
        var id = guid();
        var maxHistoryCount = pm.settings.get("historyCount");
        var requests = this.requests;
        var requestsCount = this.requests.length;

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
            pm.urlCache.addUrl(request.url);
            pm.layout.sidebar.addRequest(request.url, request.method, id, "top");
            pm.history.requests.push(request);
        });
    },


    deleteRequest:function (id) {
        pm.indexedDB.deleteRequest(id, function (request_id) {
            var historyRequests = pm.history.requests;
            var k = -1;
            var len = historyRequests.length;
            for (var i = 0; i < len; i++) {
                if (historyRequests[i].id === request_id) {
                    k = i;
                    break;
                }
            }

            if (k >= 0) {
                historyRequests.splice(k, 1);
            }

            pm.layout.sidebar.removeRequestFromHistory(request_id);
        });
    },

    clear:function () {
        pm.indexedDB.deleteHistory(function () {
            $('#history-items').html("");
        });
    }
};