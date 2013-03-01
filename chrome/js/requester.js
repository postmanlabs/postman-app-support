/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */
"use strict";
function Collection() {
    this.id = "";
    this.name = "";
    this.requests = {};
}

function CollectionRequest() {
    this.collectionId = "";
    this.id = "";
    this.name = "";
    this.description = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function Request() {
    this.id = "";
    this.name = "";
    this.description = "";
    this.url = "";
    this.method = "";
    this.headers = "";
    this.data = "";
    this.dataMode = "params";
    this.timestamp = 0;
}

function sortAlphabetical(a, b) {
    var counter;
    if (a.name.length > b.name.legnth)
        counter = b.name.length;
    else
        counter = a.name.length;

    for (var i = 0; i < counter; i++) {
        if (a.name[i] == b.name[i]) {
            continue;
        } else if (a.name[i] > b.name[i]) {
            return 1;
        } else {
            return -1;
        }
    }
    return 1;
}

var pm = {};

pm.debug = true;

pm.indexedDB = {};
pm.indexedDB.db = null;
pm.indexedDB.modes = {
    readwrite:"readwrite",
    readonly:"readonly"
};

pm.fs = {};
pm.webUrl = "http://getpostman.com";
pm.bannedHeaders = [
    'accept-charset',
    'accept-encoding',
    'access-control-request-headers',
    'access-control-request-method',
    'connection',
    'content-length',
    'cookie',
    'cookie2',
    'content-transfer-encoding',
    'date',
    'expect',
    'host',
    'keep-alive',
    'origin',
    'referer',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'user-agent',
    'via'
];

// IndexedDB implementations still use API prefixes
var indexedDB = window.indexedDB || // Use the standard DB API
    window.mozIndexedDB || // Or Firefox's early version of it
    window.webkitIndexedDB;            // Or Chrome's early version
// Firefox does not prefix these two:
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

/*
 Components

 history - History of sent requests. Can be toggled on and off
 collections - Groups of requests. Can be saved to a file. Saved requests can have a name and description to document
 the request properly.
 settings - Settings Postman behavior
 layout - Manages quite a bit of the interface
 currentRequest - Everything to do with the current request loaded in Postman. Also manages sending, receiving requests
 and processing additional parameters
 urlCache - Needed for the autocomplete functionality
 helpers - Basic and OAuth helper management. More helpers will be added later.
 keymap - Keyboard shortcuts
 envManager - Environments to customize requests using variables.
 filesystem - Loading and saving files from the local filesystem.
 indexedDB - Backend database. Right now Postman uses indexedDB.

 Plugins

 keyvaleditor - Used for URL params, headers and POST params.

 Dependencies

 jQuery
 jQuery UI - AutoComplete plugin
 jQuery HotKeys
 jQuery jScrollPane
 jQuery MouseWheel
 Bootstrap
 CodeMirror
 Underscore

 Code status

 I am not exactly happy with the code I have written. Most of this has resulted from rapid UI
 prototyping. I hope to rewrite this using either Ember or Backbone one day! Till then I'll be
 cleaning this up bit by bit.
 */

pm.init = function () {
    Handlebars.partials = Handlebars.templates;
    pm.history.init();
    pm.collections.init();
    pm.settings.init();
    pm.layout.init();
    pm.editor.init();
    pm.jsonlint.init();
    pm.request.init();
    pm.urlCache.refreshAutoComplete();
    pm.helpers.init();
    pm.keymap.init();
    pm.envManager.init();
    pm.filesystem.init();
    pm.indexedDB.open();
    pm.broadcasts.init();
    $(":input:first").focus();
};

$(document).ready(function () {
    pm.init();
});

$(window).on("unload", function () {
    pm.request.saveCurrentRequestToLocalStorage();
});

pm.broadcasts = {
    init:function () {
        var broadcasts = localStorage["broadcasts"];
        var last_update_time = localStorage["broadcast_last_update_time"];

        var today = new Date();

        pm.broadcasts.showBlank();
        pm.broadcasts.fetch();
        if (last_update_time) {
            var last_update = new Date(last_update_time);
            pm.broadcasts.setLastUpdateTime(today);
        }
        else {
            pm.broadcasts.setLastUpdateTime(today);
        }

        $("#broadcasts-count").on("click", function () {
            pm.broadcasts.markAllAsRead();
        });
    },

    showBlank:function() {
        var $broadcasts_count = $("#broadcasts-count");
        $broadcasts_count.removeClass();
        $broadcasts_count.addClass("no-new-broadcasts");
        $broadcasts_count.html("0");
    },

    fetch:function () {
        var broadcast_url = "http://www.getpostman.com/broadcasts";        
        $.get(broadcast_url, function (data) {
            pm.broadcasts.setBroadcasts(data["broadcasts"]);
            pm.broadcasts.renderBroadcasts();
        });
    },

    setLastUpdateTime:function (last_update) {
        localStorage["broadcast_last_update_time"] = last_update.toUTCString();
    },

    setBroadcasts:function (broadcasts) {
        var old_broadcasts;
        if ("broadcasts" in localStorage) {
            old_broadcasts = JSON.parse(localStorage["broadcasts"]);
        }
        else {
            old_broadcasts = [];
        }

        var i, c, count;
        if (old_broadcasts.length == 0) {
            c = broadcasts.length;
            for (i = 0; i < c; i++) {
                broadcasts[i]["status"] = "unread";
            }
            count = broadcasts.length;
            localStorage["broadcasts"] = JSON.stringify(broadcasts);
        }
        else {
            c = broadcasts.length;
            var new_broadcasts = [];
            for (i = 0; i < c; i++) {
                var b = broadcasts[i];

                var existing = _.find(old_broadcasts, function (br) {
                    return br.id === b.id;
                });
                if (!existing) {
                    b["status"] = "unread";
                    new_broadcasts.push(b);
                }
            }

            count = new_broadcasts.length;
            old_broadcasts = _.union(new_broadcasts, old_broadcasts);
            localStorage["broadcasts"] = JSON.stringify(old_broadcasts);
        }

        var $broadcasts_count = $("#broadcasts-count");
        $broadcasts_count.html(count);
        $broadcasts_count.removeClass();
        if (count > 0) {
            $broadcasts_count.addClass("new-broadcasts");
        }
        else {
            $broadcasts_count.addClass("no-new-broadcasts");
        }
    },

    markAllAsRead:function () {
        var $broadcasts_count = $("#broadcasts-count");
        $broadcasts_count.removeClass();
        $broadcasts_count.addClass("no-new-broadcasts");
        $broadcasts_count.html("0");

        var broadcasts = JSON.parse(localStorage["broadcasts"]);
        var c = broadcasts.length;
        for (var i = 0; i < c; i++) {
            broadcasts[i]["status"] = "read";
        }

        localStorage["broadcasts"] = JSON.stringify(broadcasts);
        pm.broadcasts.renderBroadcasts();
    },

    renderBroadcasts:function () {
        var broadcasts = JSON.parse(localStorage["broadcasts"]);

        $("#broadcasts .dropdown-menu").html("");
        $("#broadcasts .dropdown-menu").append(Handlebars.templates.broadcasts({"items":broadcasts}));
    }
};

pm.collections = {
    areLoaded:false,
    items:[],

    init:function () {
        this.addCollectionListeners();
    },

    addCollectionListeners:function () {
        var $collection_items = $('#collection-items');
        $collection_items.on("mouseenter", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'block');
        });

        $collection_items.on("mouseleave", ".sidebar-collection .sidebar-collection-head", function () {
            var actionsEl = jQuery('.collection-head-actions', this);
            actionsEl.css('display', 'none');
        });

        $collection_items.on("click", ".sidebar-collection-head-name", function () {
            var id = $(this).attr('data-id');
            pm.collections.toggleRequestList(id);
        });

        $collection_items.on("click", ".collection-head-actions .label", function () {
            var id = $(this).parent().parent().parent().attr('data-id');
            pm.collections.toggleRequestList(id);
        });

        $collection_items.on("click", ".request-actions-delete", function () {
            var id = $(this).attr('data-id');
            pm.collections.deleteCollectionRequest(id);
        });

        $collection_items.on("click", ".request-actions-load", function () {
            var id = $(this).attr('data-id');
            pm.collections.getCollectionRequest(id);
        });

        $collection_items.on("click", ".request-actions-edit", function () {
            var id = $(this).attr('data-id');
            $('#form-edit-collection-request .collection-request-id').val(id);

            pm.indexedDB.getCollectionRequest(id, function (req) {
                $('#form-edit-collection-request .collection-request-name').val(req.name);
                $('#form-edit-collection-request .collection-request-description').val(req.description);
                $('#modal-edit-collection-request').modal('show');
            });
        });

        $collection_items.on("click", ".collection-actions-edit", function () {
            var id = $(this).attr('data-id');
            var name = $(this).attr('data-name');
            $('#form-edit-collection .collection-id').val(id);
            $('#form-edit-collection .collection-name').val(name);
            $('#modal-edit-collection').modal('show');
        });

        $collection_items.on("click", ".collection-actions-delete", function () {
            var id = $(this).attr('data-id');
            var name = $(this).attr('data-name');

            $('#modal-delete-collection-yes').attr('data-id', id);
            $('#modal-delete-collection-name').html(name);
        });

        $('#modal-delete-collection-yes').on("click", function () {
            var id = $(this).attr('data-id');
            pm.collections.deleteCollection(id);
        });

        $('#import-collection-url-submit').on("click", function () {
            var url = $('#import-collection-url-input').val();
            pm.collections.importCollectionFromUrl(url);
        });

        $collection_items.on("click", ".collection-actions-download", function () {
            var id = $(this).attr('data-id');
            $("#modal-share-collection").modal("show");
            $('#share-collection-get-link').attr("data-collection-id", id);
            $('#share-collection-download').attr("data-collection-id", id);
            $('#share-collection-link').css("display", "none");
        });

        $('#share-collection-get-link').on("click", function () {
            var id = $(this).attr('data-collection-id');
            pm.collections.uploadCollection(id, function (link) {
                $('#share-collection-link').css("display", "block");
                $('#share-collection-link').html(link);
            });
        });

        $('#share-collection-download').on("click", function () {
            var id = $(this).attr('data-collection-id');
            pm.collections.saveCollection(id);
        });

        $('#request-samples').on("click", ".sample-response-name", function () {
            var id = $(this).attr("data-id");
            pm.collections.loadResponseInEditor(id);
        });

        $('#request-samples').on("click", ".sample-response-delete", function () {
            var id = $(this).attr("data-id");
            pm.collections.removeSampleResponse(id);
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

            pm.collections.importCollections(files);
        }, false);

        $('#collection-files-input').on('change', function (event) {
            var files = event.target.files;
            pm.collections.importCollections(files);
            $('#collection-files-input').val("");
        });
    },

    getCollectionData:function (id, callback) {
        pm.indexedDB.getCollection(id, function (data) {
            var collection = data;
            pm.indexedDB.getAllRequestsInCollection(collection, function (collection, data) {
                var ids = [];
                for (var i = 0, count = data.length; i < count; i++) {
                    ids.push(data[i].id);
                }

                //Get all collection requests with one call
                collection['requests'] = data;
                var name = collection['name'] + ".json";
                var type = "application/json";
                var filedata = JSON.stringify(collection);
                callback(name, type, filedata);
            });
        });
    },

    saveCollection:function (id) {
        pm.collections.getCollectionData(id, function (name, type, filedata) {
            pm.filesystem.saveAndOpenFile(name, filedata, type, function () {
            });
        });
    },

    uploadCollection:function (id, callback) {
        pm.collections.getCollectionData(id, function (name, type, filedata) {
            var uploadUrl = pm.webUrl + '/collections';
            $.ajax({
                type:'POST',
                url:uploadUrl,
                data:filedata,
                success:function (data) {
                    var link = data.link;
                    callback(link);
                }
            });

        });
    },

    importCollectionData:function (collection) {        
        pm.indexedDB.addCollection(collection, function (c) {
            var message = {
                name:collection.name,
                action:"added"
            };

            $('.modal-import-alerts').append(Handlebars.templates.message_collection_added(message));

            var requests = [];

            var ordered = false;
            if ("order" in collection) {
                ordered = true;
            }

            for (var i = 0; i < collection.requests.length; i++) {
                var request = collection.requests[i];
                request.collectionId = collection.id;
                var newId = guid();

                if (ordered) {
                    var currentId = request.id;
                    var loc = _.indexOf(collection["order"], currentId);
                    collection["order"][loc] = newId;
                }

                request.id = newId;

                if ("responses" in request) {
                    var j, count;
                    for (j = 0, count = request["responses"].length; j < count; j++) {
                        request["responses"][j].id = guid();
                        request["responses"][j].collectionRequestId = newId;                        
                    }
                }

                pm.indexedDB.addCollectionRequest(request, function (req) {});
                requests.push(request);
            }

            pm.indexedDB.updateCollection(collection, function() {});
            
            collection.requests = requests;
            pm.collections.render(collection);
        });
    },

    importCollections:function (files) {
        // Loop through the FileList
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    var data = e.currentTarget.result;
                    var collection = JSON.parse(data);
                    collection.id = guid();
                    pm.collections.importCollectionData(collection);
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    },

    importCollectionFromUrl:function (url) {
        $.get(url, function (data) {
            var collection = data;
            collection.id = guid();
            pm.collections.importCollectionData(collection);
        });
    },

    getCollectionRequest:function (id) {
        pm.indexedDB.getCollectionRequest(id, function (request) {
            pm.request.isFromCollection = true;
            pm.request.collectionRequestId = id;
            pm.request.loadRequestInEditor(request, true);
        });
    },

    loadResponseInEditor:function (id) {
        var responses = pm.request.responses;        
        var responseIndex = find(responses, function (item, i, responses) {
            return item.id === id;
        });

        var response = responses[responseIndex];
        pm.request.loadRequestInEditor(response.request, false, true);
        pm.request.response.render(response);
    },

    removeSampleResponse:function (id) {
        var responses = pm.request.responses;
        var responseIndex = find(responses, function (item, i, responses) {
            return item.id === id;
        });

        var response = responses[responseIndex];
        responses.splice(responseIndex, 1);

        pm.indexedDB.getCollectionRequest(response.collectionRequestId, function (request) {
            request["responses"] = responses;
            pm.indexedDB.updateCollectionRequest(request, function () {
                $('#request-samples table tr[data-id="' + response.id + '"]').remove();
            });

        });
    },

    openCollection:function (id) {
        var target = "#collection-requests-" + id;
        if ($(target).css("display") === "none") {
            $(target).slideDown(100, function () {
                pm.layout.refreshScrollPanes();
            });
        }
    },

    toggleRequestList:function (id) {
        var target = "#collection-requests-" + id;
        var label = "#collection-" + id + " .collection-head-actions .label";
        if ($(target).css("display") === "none") {
            $(target).slideDown(100, function () {
                pm.layout.refreshScrollPanes();
            });
        }
        else {
            $(target).slideUp(100, function () {
                pm.layout.refreshScrollPanes();
            });
        }
    },

    addCollection:function () {
        var newCollection = $('#new-collection-blank').val();

        var collection = new Collection();

        if (newCollection) {
            //Add the new collection and get guid
            collection.id = guid();
            collection.name = newCollection;
            pm.indexedDB.addCollection(collection, function (collection) {
                pm.collections.render(collection);
            });

            $('#new-collection-blank').val("");
        }

        $('#modal-new-collection').modal('hide');
    },

    updateCollectionFromCurrentRequest:function () {
        var url = $('#url').val();
        var collectionRequest = new CollectionRequest();
        collectionRequest.id = pm.request.collectionRequestId;
        collectionRequest.headers = pm.request.getPackedHeaders();
        collectionRequest.url = url;
        collectionRequest.method = pm.request.method;
        collectionRequest.data = pm.request.body.getData(true);
        collectionRequest.dataMode = pm.request.dataMode;
        collectionRequest.version = 2;
        collectionRequest.time = new Date().getTime();

        pm.indexedDB.getCollectionRequest(collectionRequest.id, function (req) {
            collectionRequest.name = req.name;
            collectionRequest.description = req.description;
            collectionRequest.collectionId = req.collectionId;
            $('#sidebar-request-' + req.id + " .request .label").removeClass('label-method-' + req.method);

            pm.indexedDB.updateCollectionRequest(collectionRequest, function (request) {
                var requestName;
                if (request.name == undefined) {
                    request.name = request.url;
                }

                requestName = limitStringLineWidth(request.name, 43);

                $('#sidebar-request-' + request.id + " .request .request-name").html(requestName);
                $('#sidebar-request-' + request.id + " .request .label").html(request.method);
                $('#sidebar-request-' + request.id + " .request .label").addClass('label-method-' + request.method);
                noty(
                    {
                        type:'success',
                        text:'Saved request',
                        layout:'topRight',
                        timeout:750
                    });
            });
        });

    },

    addRequestToCollection:function () {
        var existingCollectionId = $('#select-collection').val();
        var newCollection = $("#new-collection").val();
        var newRequestName = $('#new-request-name').val();
        var newRequestDescription = $('#new-request-description').val();

        var url = $('#url').val();
        if (newRequestName === "") {
            newRequestName = url;
        }

        var collection = new Collection();

        var collectionRequest = new CollectionRequest();
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

        if (newCollection) {
            //Add the new collection and get guid
            collection.id = guid();
            collection.name = newCollection;
            pm.indexedDB.addCollection(collection, function (collection) {
                $('#sidebar-section-collections .empty-message').css("display", "none");
                $('#new-collection').val("");
                collectionRequest.collectionId = collection.id;

                $('#select-collection').append(Handlebars.templates.item_collection_selector_list(collection));
                $('#collection-items').append(Handlebars.templates.item_collection_sidebar_head(collection));

                $('a[rel="tooltip"]').tooltip();
                pm.layout.refreshScrollPanes();
                pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                    var targetElement = "#collection-requests-" + req.collectionId;
                    pm.urlCache.addUrl(req.url);

                    if (typeof req.name === "undefined") {
                        req.name = req.url;
                    }
                    req.name = limitStringLineWidth(req.name, 43);

                    $(targetElement).append(Handlebars.templates.item_collection_sidebar_request(req));

                    pm.layout.refreshScrollPanes();

                    pm.request.isFromCollection = true;
                    pm.request.collectionRequestId = collectionRequest.id;
                    $('#update-request-in-collection').css("display", "inline-block");
                    pm.collections.openCollection(collectionRequest.collectionId);
                });
            });
        }
        else {
            //Get guid of existing collection
            collection.id = existingCollectionId;
            collectionRequest.collectionId = collection.id;
            pm.indexedDB.addCollectionRequest(collectionRequest, function (req) {
                var targetElement = "#collection-requests-" + req.collectionId;
                pm.urlCache.addUrl(req.url);

                if (typeof req.name === "undefined") {
                    req.name = req.url;
                }
                req.name = limitStringLineWidth(req.name, 43);

                $(targetElement).append(Handlebars.templates.item_collection_sidebar_request(req));
                pm.layout.refreshScrollPanes();

                pm.request.isFromCollection = true;
                pm.request.collectionRequestId = collectionRequest.id;
                $('#update-request-in-collection').css("display", "inline-block");
                pm.collections.openCollection(collectionRequest.collectionId);

                //Update collection's order element    
                pm.indexedDB.getCollection(collection.id, function(collection) {
                    if("order" in collection) {
                        collection["order"].push(collectionRequest.id);
                        pm.indexedDB.updateCollection(collection, function() {});
                    }
                });
            });
        }

        pm.layout.sidebar.select("collections");

        $('#request-meta').css("display", "block");
        $('#request-name').css("display", "block");
        $('#request-description').css("display", "block");
        $('#request-name').html(newRequestName);
        $('#request-description').html(newRequestDescription);
        $('#sidebar-selectors a[data-id="collections"]').tab('show');
    },

    getAllCollections:function () {
        $('#collection-items').html("");
        $('#select-collection').html("<option>Select</option>");
        pm.indexedDB.getCollections(function (items) {
            pm.collections.items = items;
            pm.collections.items.sort(sortAlphabetical);

            var itemsLength = items.length;

            if (itemsLength === 0) {
                $('#sidebar-section-collections').append(Handlebars.templates.message_no_collection({}));
            }
            else {
                for (var i = 0; i < itemsLength; i++) {
                    var collection = items[i];
                    pm.indexedDB.getAllRequestsInCollection(collection, function (collection, requests) {
                        collection.requests = requests;
                        pm.collections.render(collection);
                    });
                }
            }


            pm.collections.areLoaded = true;
            pm.layout.refreshScrollPanes();
        });
    },

    render:function (collection) {
        $('#sidebar-section-collections .empty-message').css("display", "none");

        var currentEl = $('#collection-' + collection.id);
        if (currentEl) {
            currentEl.remove();
        }

        $('#select-collection').append(Handlebars.templates.item_collection_selector_list(collection));
        $('#collection-items').append(Handlebars.templates.item_collection_sidebar_head(collection));

        $('a[rel="tooltip"]').tooltip();

        if ("requests" in collection) {
            var id = collection.id;
            var requests = collection.requests;
            var targetElement = "#collection-requests-" + id;
            var count = requests.length;

            if (count > 0) {
                for (var i = 0; i < count; i++) {
                    pm.urlCache.addUrl(requests[i].url);
                    if (typeof requests[i].name === "undefined") {
                        requests[i].name = requests[i].url;
                    }
                    requests[i].name = limitStringLineWidth(requests[i].name, 40);
                }

                //Sort requests as A-Z order
                if (!("order" in collection)) {
                    requests.sort(sortAlphabetical);
                }
                else {
                    if(collection["order"].length == requests.length) {
                        var orderedRequests = [];                    
                        for (var j = 0, len = collection["order"].length; j < len; j++) {
                            var element = _.find(requests, function (request) {
                                return request.id == collection["order"][j]
                            });
                            orderedRequests.push(element);
                        }
                        requests = orderedRequests;
                    }
                }

                console.log(requests);

                $(targetElement).append(Handlebars.templates.collection_sidebar({"items":requests}));
                $(targetElement).sortable({
                    update:function (event, ui) {
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

                        pm.indexedDB.getCollection(collection_id, function (collection) {                            
                            collection["order"] = order;
                            pm.indexedDB.updateCollection(collection, function (collection) {
                            });
                        });

                    }
                });
            }

        }

        pm.layout.refreshScrollPanes();
    },

    deleteCollectionRequest:function (id) {
        pm.indexedDB.deleteCollectionRequest(id, function () {
            pm.layout.sidebar.removeRequestFromHistory(id);
        });
    },

    deleteCollection:function (id) {
        pm.indexedDB.deleteCollection(id, function () {
            pm.layout.sidebar.removeCollection(id);

            var target = '#select-collection option[value="' + id + '"]';
            $(target).remove();
        });
    },

    saveResponseAsSample:function (response) {
        pm.indexedDB.getCollectionRequest(response.collectionRequestId, function (request) {
            if ("responses" in request && request["responses"] !== undefined) {
                request["responses"].push(response);
            }
            else {
                request["responses"] = [response];
            }

            pm.request.responses = request["responses"];
            pm.indexedDB.updateCollectionRequest(request, function () {
                noty(
                    {
                        type:'success',
                        text:'Saved response',
                        layout:'topRight',
                        timeout:750
                    });

                $('#request-samples').css("display", "block");
                $('#request-samples table').append(Handlebars.templates.item_sample_response(response));
            });

        });
    }
};
pm.editor = {
    mode:"html",
    codeMirror:null,
    charCount:0,

    //Defines a links mode for CodeMirror
    init:function () {
        CodeMirror.defineMode("links", function (config, parserConfig) {
            var linksOverlay = {
                startState:function () {
                    return { "link":"" }
                },

                token:function (stream, state) {
                    if (stream.eatSpace()) {
                        return null;
                    }

                    var matches;
                    if (matches = stream.match(/https?:\/\/[^\\'"\n\t\s]*(?=[<"'\n\t\s])/, false)) {
                        //Eat all characters before http link
                        var m = stream.match(/.*(?=https?:)/, true);
                        if (m) {
                            if (m[0].length > 0) {
                                return null;
                            }
                        }

                        var match = matches[0];
                        if (match != state.link) {
                            state.link = matches[0];
                            for (var i = 0; i < state.link.length; i++) {
                                stream.next();
                            }
                            state.link = "";
                            return "link";
                        }

                        stream.skipToEnd();
                        return null;
                    }

                    stream.skipToEnd();
                    return null;

                }
            };

            return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || pm.editor.mode), linksOverlay);
        });
    },

    toggleLineWrapping:function () {
        var lineWrapping = pm.editor.codeMirror.getOption("lineWrapping");
        if (lineWrapping === true) {
            $('#response-body-line-wrapping').removeClass("active");
            lineWrapping = false;
            pm.editor.codeMirror.setOption("lineWrapping", false);
        }
        else {
            $('#response-body-line-wrapping').addClass("active");
            lineWrapping = true;
            pm.editor.codeMirror.setOption("lineWrapping", true);
        }

        pm.settings.set("lineWrapping", lineWrapping);
    }
};
pm.envManager = {
    environments:[],

    globals:{},
    selectedEnv:null,
    selectedEnvironmentId:"",

    quicklook:{
        init:function () {
            pm.envManager.quicklook.refreshEnvironment(pm.envManager.selectedEnv);
            pm.envManager.quicklook.refreshGlobals(pm.envManager.globals);
        },

        removeEnvironmentData:function () {
            $('#environment-quicklook-environments h6').html("No environment");
            $('#environment-quicklook-environments ul').html("");
        },

        refreshEnvironment:function (environment) {
            if (!environment) {
                return;
            }
            $('#environment-quicklook-environments h6').html(environment.name);
            $('#environment-quicklook-environments ul').html("");
            $('#environment-quicklook-environments ul').append(Handlebars.templates.environment_quicklook({
                "items":environment.values
            }));
        },

        refreshGlobals:function (globals) {
            if (!globals) {
                return;
            }

            $('#environment-quicklook-globals ul').html("");
            $('#environment-quicklook-globals ul').append(Handlebars.templates.environment_quicklook({
                "items":globals
            }));
        },

        toggleDisplay:function () {
            var display = $('#environment-quicklook-content').css("display");

            if (display == "none") {
                $('#environment-quicklook-content').css("display", "block");
            }
            else {
                $('#environment-quicklook-content').css("display", "none");
            }
        }
    },

    init:function () {
        pm.envManager.initGlobals();
        $('#environment-list').append(Handlebars.templates.environment_list({"items":this.environments}));

        $('#environments-list').on("click", ".environment-action-delete", function () {
            var id = $(this).attr('data-id');
            $('a[rel="tooltip"]').tooltip('hide');
            pm.envManager.deleteEnvironment(id);
        });

        $('#environments-list').on("click", ".environment-action-edit", function () {
            var id = $(this).attr('data-id');
            pm.envManager.showEditor(id);
        });

        $('#environments-list').on("click", ".environment-action-duplicate", function () {
            var id = $(this).attr('data-id');
            pm.envManager.duplicateEnvironment(id);
        });

        $('#environments-list').on("click", ".environment-action-download", function () {
            var id = $(this).attr('data-id');
            pm.envManager.downloadEnvironment(id);
        });

        $('.environment-action-back').on("click", function () {
            pm.envManager.showSelector();
        });

        $('#environment-selector').on("click", ".environment-list-item", function () {
            var id = $(this).attr('data-id');
            var selectedEnv = pm.envManager.getEnvironmentFromId(id);
            pm.envManager.selectedEnv = selectedEnv;
            pm.settings.set("selectedEnvironmentId", selectedEnv.id);
            pm.envManager.quicklook.refreshEnvironment(selectedEnv);
            $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
        });

        $('#environment-selector').on("click", ".environment-list-item-noenvironment", function () {
            pm.envManager.selectedEnv = null;
            pm.settings.set("selectedEnvironmentId", "");
            pm.envManager.quicklook.removeEnvironmentData();
            $('#environment-selector .environment-list-item-selected').html("No environment");
        });

        $('#environment-quicklook').on("mouseenter", function () {
            $('#environment-quicklook-content').css("display", "block");
        });

        $('#environment-quicklook').on("mouseleave", function () {
            $('#environment-quicklook-content').css("display", "none");
        });

        $('#environment-files-input').on('change', function (event) {
            var files = event.target.files;
            pm.envManager.importEnvironments(files);
            $('#environment-files-input').val("");
        });


        $('.environments-actions-add').on("click", function () {
            pm.envManager.showEditor();
        });

        $('.environments-actions-import').on('click', function () {
            pm.envManager.showImporter();
        });

        $('.environments-actions-manage-globals').on('click', function () {
            pm.envManager.showGlobals();
        });

        $('.environments-actions-add-submit').on("click", function () {
            var id = $('#environment-editor-id').val();
            if (id === "0") {
                pm.envManager.addEnvironment();
            }
            else {
                pm.envManager.updateEnvironment();
            }

            $('#environment-editor-name').val("");
            $('#environment-keyvaleditor').keyvalueeditor('reset', []);

        });

        $('.environments-actions-add-back').on("click", function () {
            pm.envManager.saveGlobals();
            pm.envManager.showSelector();
            $('#environment-editor-name').val("");
            $('#environment-keyvaleditor').keyvalueeditor('reset', []);
        });

        $('#environments-list-help-toggle').on("click", function () {
            var d = $('#environments-list-help-detail').css("display");
            if (d === "none") {
                $('#environments-list-help-detail').css("display", "inline");
                $(this).html("Hide");
            }
            else {
                $('#environments-list-help-detail').css("display", "none");
                $(this).html("Tell me more");
            }
        });

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $('#environment-keyvaleditor').keyvalueeditor('init', params);
        $('#globals-keyvaleditor').keyvalueeditor('init', params);
        $('#globals-keyvaleditor').keyvalueeditor('reset', pm.envManager.globals);
        pm.envManager.quicklook.init();
    },

    getEnvironmentFromId:function (id) {
        var environments = pm.envManager.environments;
        var count = environments.length;
        for (var i = 0; i < count; i++) {
            var env = environments[i];
            if (id === env.id) {
                return env;
            }
        }

        return false;
    },

    containsVariable:function (string, values) {
        var variableDelimiter = pm.settings.get("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);
        var patString = startDelimiter + "[^\r\n]*" + endDelimiter;
        var pattern = new RegExp(patString, 'g');
        var matches = string.match(pattern);
        var count = values.length;
        var variable;

        if(matches === null) {
            return false;
        }

        for(var i = 0; i < count; i++) {
            variable = startDelimiter + values[i].key + endDelimiter;
            if(_.indexOf(matches, variable) >= 0) {
                return true;
            }
        }

        return false;
    },

    processString:function (string, values) {
        var count = values.length;
        var finalString = string;
        var patString;
        var pattern;

        var variableDelimiter = pm.settings.get("variableDelimiter");
        var startDelimiter = variableDelimiter.substring(0, 2);
        var endDelimiter = variableDelimiter.substring(variableDelimiter.length - 2);

        for (var i = 0; i < count; i++) {
            patString = startDelimiter + values[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, values[i].value);
        }

        var globals = pm.envManager.globals;
        count = globals.length;
        for (i = 0; i < count; i++) {
            patString = startDelimiter + globals[i].key + endDelimiter;
            pattern = new RegExp(patString, 'g');
            finalString = finalString.replace(patString, globals[i].value);
        }

        if (pm.envManager.containsVariable(finalString, values)) {
            finalString = pm.envManager.processString(finalString, values);
            return finalString;
        }
        else {
            return finalString;
        }
    },

    convertString:function (string) {
        var environment = pm.envManager.selectedEnv;
        var envValues = [];

        if (environment !== null) {
            envValues = environment.values;
        }

        return pm.envManager.processString(string, envValues);
    },

    getAllEnvironments:function () {
        pm.indexedDB.environments.getAllEnvironments(function (environments) {
            environments.sort(sortAlphabetical);
            console.log(environments);                
            
            $('#environment-selector .dropdown-menu').html("");
            $('#environments-list tbody').html("");
            pm.envManager.environments = environments;


            $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector({"items":environments}));
            $('#environments-list tbody').append(Handlebars.templates.environment_list({"items":environments}));
            $('#environment-selector .dropdown-menu').append(Handlebars.templates.environment_selector_actions());

            var selectedEnvId = pm.settings.get("selectedEnvironmentId");
            var selectedEnv = pm.envManager.getEnvironmentFromId(selectedEnvId);
            if (selectedEnv) {
                pm.envManager.selectedEnv = selectedEnv;
                pm.envManager.quicklook.refreshEnvironment(selectedEnv);
                $('#environment-selector .environment-list-item-selected').html(selectedEnv.name);
            }
            else {
                pm.envManager.selectedEnv = null;
                $('#environment-selector .environment-list-item-selected').html("No environment");
            }
        })
    },

    initGlobals:function () {
        if ('globals' in localStorage) {
            var globalsString = localStorage['globals'];
            pm.envManager.globals = JSON.parse(globalsString);
        }
        else {
            pm.envManager.globals = [];
        }

    },

    saveGlobals:function () {
        var globals = $('#globals-keyvaleditor').keyvalueeditor('getValues');
        pm.envManager.globals = globals;
        pm.envManager.quicklook.refreshGlobals(globals);
        localStorage['globals'] = JSON.stringify(globals);
    },

    showSelector:function () {
        $('#environments-list-wrapper').css("display", "block");
        $('#environment-editor').css("display", "none");
        $('#environment-importer').css("display", "none");
        $('#globals-editor').css("display", "none");
        $('.environments-actions-add-submit').css("display", "inline");
        $('#modal-environments .modal-footer').css("display", "none");
    },

    showEditor:function (id) {
        if (id) {
            var environment = pm.envManager.getEnvironmentFromId(id);
            $('#environment-editor-name').val(environment.name);
            $('#environment-editor-id').val(id);
            $('#environment-keyvaleditor').keyvalueeditor('reset', environment.values);
        }
        else {
            $('#environment-editor-id').val(0);
        }

        $('#environments-list-wrapper').css("display", "none");
        $('#environment-editor').css("display", "block");
        $('#globals-editor').css("display", "none");
        $('#modal-environments .modal-footer').css("display", "block");
    },

    showImporter:function () {
        $('#environments-list-wrapper').css("display", "none");
        $('#environment-editor').css("display", "none");
        $('#globals-editor').css("display", "none");
        $('#environment-importer').css("display", "block");
        $('.environments-actions-add-submit').css("display", "none");
        $('#modal-environments .modal-footer').css("display", "block");
    },

    showGlobals:function () {
        $('#environments-list-wrapper').css("display", "none");
        $('#environment-editor').css("display", "none");
        $('#globals-editor').css("display", "block");
        $('#environment-importer').css("display", "none");
        $('.environments-actions-add-submit').css("display", "none");
        $('#modal-environments .modal-footer').css("display", "block");
    },

    addEnvironment:function () {
        var name = $('#environment-editor-name').val();
        var values = $('#environment-keyvaleditor').keyvalueeditor('getValues');
        var environment = {
            id:guid(),
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.addEnvironment(environment, function () {
            pm.envManager.getAllEnvironments();
            pm.envManager.showSelector();
        });
    },

    updateEnvironment:function () {
        var id = $('#environment-editor-id').val();
        var name = $('#environment-editor-name').val();
        var values = $('#environment-keyvaleditor').keyvalueeditor('getValues');
        var environment = {
            id:id,
            name:name,
            values:values,
            timestamp:new Date().getTime()
        };

        pm.indexedDB.environments.updateEnvironment(environment, function () {
            pm.envManager.getAllEnvironments();
            pm.envManager.showSelector();
        });
    },

    deleteEnvironment:function (id) {
        pm.indexedDB.environments.deleteEnvironment(id, function () {
            pm.envManager.getAllEnvironments();
            pm.envManager.showSelector();
        });
    },

    duplicateEnvironment:function (id) {
        var env = pm.envManager.getEnvironmentFromId(id);
        
        //get a new name for this duplicated environment
        env.name = env.name + " " + "copy";
        
        //change the env guid
        env.id = guid();

        pm.indexedDB.environments.addEnvironment(env, function () {
            //Add confirmation
            var o = {
                name:env.name,
                action:'added'
            };

            pm.envManager.getAllEnvironments();
        });        
    },

    downloadEnvironment:function (id) {
        var env = pm.envManager.getEnvironmentFromId(id);
        var name = env.name + "-environment.json";
        var type = "application/json";
        var filedata = JSON.stringify(env);
        pm.filesystem.saveAndOpenFile(name, filedata, type, function () {
        });
    },

    importEnvironments:function (files) {
        // Loop through the FileList
        for (var i = 0, f; f = files[i]; i++) {
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {
                    // Render thumbnail.
                    var data = e.currentTarget.result;
                    var environment = JSON.parse(data);

                    pm.indexedDB.environments.addEnvironment(environment, function () {
                        //Add confirmation
                        var o = {
                            name:environment.name,
                            action:'added'
                        };

                        $('#environment-importer-confirmations').append(Handlebars.templates.message_environment_added(o));
                        pm.envManager.getAllEnvironments();
                    });
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    }

};
pm.filesystem = {
    fs:{},

    onInitFs:function (filesystem) {
        pm.filesystem.fs = filesystem;
    },

    errorHandler:function (e) {
        var msg = '';

        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
        }

        console.log('Error: ' + msg);
    },

    init:function () {
        window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, this.onInitFs, this.errorHandler);
    },

    removeFileIfExists:function (name, callback) {
        pm.filesystem.fs.root.getFile(name,
            {create:false}, function (fileEntry) {
                fileEntry.remove(function () {
                    callback();
                }, function () {
                    callback();
                });
            }, function () {
                callback();
            });
    },

    renderResponsePreview:function (name, data, type, callback) {
        name = encodeURI(name);
        name = name.replace("/", "_");
        pm.filesystem.removeFileIfExists(name, function () {
            pm.filesystem.fs.root.getFile(name,
                {create:true},
                function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function (e) {
                            var properties = {
                                url:fileEntry.toURL()
                            };

                            callback(properties.url);
                        };

                        fileWriter.onerror = function (e) {
                            callback(false);
                        };

                        var blob;
                        if (type == "pdf") {
                            blob = new Blob([data], {type:'application/pdf'});
                        }
                        else {
                            blob = new Blob([data], {type:'text/plain'});
                        }
                        fileWriter.write(blob);


                    }, pm.filesystem.errorHandler);


                }, pm.filesystem.errorHandler
            );
        });
    },

    saveAndOpenFile:function (name, data, type, callback) {
        name = encodeURI(name);
        name = name.replace("/", "_");
        pm.filesystem.removeFileIfExists(name, function () {
            pm.filesystem.fs.root.getFile(name,
                {create:true},
                function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {

                        fileWriter.onwriteend = function (e) {
                            var properties = {
                                url:fileEntry.toURL()
                            };

                            if (typeof chrome !== "undefined") {
                                chrome.tabs.create(properties, function (tab) {
                                });
                            }

                            callback();
                        };

                        fileWriter.onerror = function (e) {
                            callback();
                        };

                        var blob;
                        if (type == "pdf") {
                            blob = new Blob([data], {type:'application/pdf'});
                        }
                        else {
                            blob = new Blob([data], {type:'text/plain'});
                        }
                        fileWriter.write(blob);

                    }, pm.filesystem.errorHandler);


                }, pm.filesystem.errorHandler
            );
        });

    }
};
pm.headerPresets = {
    presets:[],
    presetsForAutoComplete:[],

    init:function () {
        pm.headerPresets.loadPresets();

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $("#header-presets-keyvaleditor").keyvalueeditor("init", params);
        $("#headers-keyvaleditor-actions-manage-presets").on("click", function () {
            pm.headerPresets.showManager();
        });

        $(".header-presets-actions-add").on("click", function () {
            pm.headerPresets.showEditor();
        });

        $(".header-presets-actions-back").on("click", function () {
            pm.headerPresets.showList();
        });

        $(".header-presets-actions-submit").on("click", function () {
            var id = $('#header-presets-editor-id').val();
            if (id === "0") {
                pm.headerPresets.addHeaderPreset();
            }
            else {
                var name = $('#header-presets-editor-name').val();
                var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");
                pm.headerPresets.editHeaderPreset(id, name, headers);
            }

            pm.headerPresets.showList();
        });

        $("#header-presets-list").on("click", ".header-preset-action-edit", function () {
            var id = $(this).attr("data-id");
            var preset = pm.headerPresets.getHeaderPreset(id);
            $('#header-presets-editor-name').val(preset.name);
            $('#header-presets-editor-id').val(preset.id);
            $('#header-presets-keyvaleditor').keyvalueeditor('reset', preset.headers);
            pm.headerPresets.showEditor();
        });

        $("#header-presets-list").on("click", ".header-preset-action-delete", function () {
            var id = $(this).attr("data-id");
            pm.headerPresets.deleteHeaderPreset(id);
        });
    },

    loadPresets:function () {
        pm.indexedDB.headerPresets.getAllHeaderPresets(function (items) {
            pm.headerPresets.presets = items;
            pm.headerPresets.refreshAutoCompleteList();
            $('#header-presets-list tbody').html("");
            $('#header-presets-list tbody').append(Handlebars.templates.header_preset_list({"items":items}));
        });
    },

    showManager:function () {
        $("#modal-header-presets").modal("show");
    },

    showList:function () {
        $("#header-presets-list-wrapper").css("display", "block");
        $("#header-presets-editor").css("display", "none");
        $("#header-presets-editor-name").attr("value", "");
        $("#header-presets-editor-id").attr("value", 0);
        $('#header-presets-keyvaleditor').keyvalueeditor('reset', []);
        $("#modal-header-presets .modal-footer").css("display", "none");
    },

    showEditor:function () {
        $("#modal-header-presets .modal-footer").css("display", "block");
        $("#header-presets-list-wrapper").css("display", "none");
        $("#header-presets-editor").css("display", "block");
    },

    getHeaderPreset:function (id) {
        for (var i = 0, count = pm.headerPresets.presets.length; i < count; i++) {
            if (pm.headerPresets.presets[i].id === id) break;
        }

        var preset = pm.headerPresets.presets[i];
        return preset;
    },

    addHeaderPreset:function () {
        var name = $("#header-presets-editor-name").val();
        var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");
        var id = guid();

        var headerPreset = {
            "id":id,
            "name":name,
            "headers":headers,
            "timestamp":new Date().getTime()
        };

        pm.indexedDB.headerPresets.addHeaderPreset(headerPreset, function () {
            pm.headerPresets.loadPresets();
        });
    },

    editHeaderPreset:function (id, name, headers) {
        pm.indexedDB.headerPresets.getHeaderPreset(id, function (preset) {
            var headerPreset = {
                "id":id,
                "name":name,
                "headers":headers,
                "timestamp":preset.timestamp
            };

            pm.indexedDB.headerPresets.updateHeaderPreset(headerPreset, function () {
                pm.headerPresets.loadPresets();
            });
        });
    },

    deleteHeaderPreset:function (id) {
        pm.indexedDB.headerPresets.deleteHeaderPreset(id, function () {
            pm.headerPresets.loadPresets();
        });
    },

    getPresetsForAutoComplete:function () {
        var list = [];
        for (var i = 0, count = pm.headerPresets.presets.length; i < count; i++) {
            var preset = pm.headerPresets.presets[i];
            var item = {
                "id":preset.id,
                "type":"preset",
                "label":preset.name,
                "category":"Header presets"
            };

            list.push(item);
        }

        return list;
    },

    refreshAutoCompleteList:function () {
        var presets = pm.headerPresets.getPresetsForAutoComplete();
        pm.headerPresets.presetsForAutoComplete = _.union(presets, chromeHeaders);
    }
};
pm.helpers = {
    activeHelper: "normal",

    init:function () {
        $("#request-types .request-helper-tabs li").on("click", function () {
            $("#request-types .request-helper-tabs li").removeClass("active");
            $(this).addClass("active");
            var type = $(this).attr('data-id');
            pm.helpers.showRequestHelper(type);
        });

        $('.request-helper-submit').on("click", function () {
            var type = $(this).attr('data-type');
            $('#request-helpers').css("display", "none");
            pm.helpers.processRequestHelper(type);
        });

        pm.helpers.oAuth1.init();

    },

    processRequestHelper:function (type) {
        if (type === 'basic') {
            this.basic.process();
        }
        else if (type === 'oAuth1') {
            this.oAuth1.process();
        }
        return false;
    },

    showRequestHelper:function (type) {
        pm.helpers.activeHelper = type.toLowerCase();
        $("#request-types ul li").removeClass("active");
        $('#request-types ul li[data-id=' + type + ']').addClass('active');
        if (type !== "normal") {
            $('#request-helpers').css("display", "block");
        }
        else {
            $('#request-helpers').css("display", "none");
        }

        if (type.toLowerCase() === 'oauth1') {
            this.oAuth1.generateHelper();
        }

        $('.request-helpers').css("display", "none");
        $('#request-helper-' + type).css("display", "block");
        return false;
    },

    basic:{
        process:function () {
            var headers = pm.request.headers;
            var authHeaderKey = "Authorization";
            var pos = findPosition(headers, "key", authHeaderKey);

            var username = $('#request-helper-basicAuth-username').val();
            var password = $('#request-helper-basicAuth-password').val();

            username = pm.envManager.convertString(username);
            password = pm.envManager.convertString(password);

            var rawString = username + ":" + password;
            var encodedString = "Basic " + btoa(rawString);

            if (pos >= 0) {
                headers[pos] = {
                    key:authHeaderKey,
                    name:authHeaderKey,
                    value:encodedString
                };
            }
            else {
                headers.push({key:authHeaderKey, name:authHeaderKey, value:encodedString});
            }

            pm.request.headers = headers;
            $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
            pm.request.openHeaderEditor();
        }
    },

    oAuth1:{
        isAutoEnabled: false,

        init:function () {
            $('#request-helper-oauth1-auto').click(function() {
                var isAutoEnabled = $('#request-helper-oauth1-auto').attr('checked') ? true : false;
                pm.helpers.oAuth1.isAutoEnabled = isAutoEnabled;
                
                if(!isAutoEnabled) {
                    $('#request-helper-oAuth1 .request-helper-submit').css("display", "inline-block");
                }
                else {
                    $('#request-helper-oAuth1 .request-helper-submit').css("display", "none");   
                }
            });
        },

        generateHelper:function () {
            $('#request-helper-oauth1-timestamp').val(OAuth.timestamp());
            $('#request-helper-oauth1-nonce').val(OAuth.nonce(6));
        },

        generateSignature:function () {
            //Make sure the URL is urlencoded properly
            //Set the URL keyval editor as well. Other get params disappear when you click on URL params again
            if ($('#url').val() === '') {
                $('#request-helpers').css("display", "block");
                alert('Please enter the URL first.');
                return null;
            }

            var processedUrl = pm.envManager.convertString($('#url').val()).trim();
            processedUrl = ensureProperUrl(processedUrl);

            if (processedUrl.indexOf('?') > 0) {
                processedUrl = processedUrl.split("?")[0];
            }

            var message = {
                action:processedUrl,
                method:pm.request.method,
                parameters:[]
            };

            //all the fields defined by oauth
            $('input.signatureParam').each(function () {
                if ($(this).val() != '') {
                    var val = $(this).val();
                    val = pm.envManager.convertString(val);
                    message.parameters.push([$(this).attr('key'), val]);
                }
            });

            //Get parameters
            var urlParams = $('#url-keyvaleditor').keyvalueeditor('getValues');
            var bodyParams = [];

            if (pm.request.isMethodWithBody(pm.request.method)) {
                if (pm.request.body.mode == "params") {
                    bodyParams = $('#formdata-keyvaleditor').keyvalueeditor('getValues');
                }
                else if (pm.request.body.mode == "urlencoded") {
                    bodyParams = $('#urlencoded-keyvaleditor').keyvalueeditor('getValues');
                }
            }


            var params = urlParams.concat(bodyParams);

            for (var i = 0; i < params.length; i++) {
                var param = params[i];
                if (param.key) {
                    param.value = pm.envManager.convertString(param.value);
                    message.parameters.push([param.key, param.value]);
                }
            }

            var accessor = {};
            if ($('input[key="oauth_consumer_secret"]').val() != '') {
                accessor.consumerSecret = $('input[key="oauth_consumer_secret"]').val();
                accessor.consumerSecret = pm.envManager.convertString(accessor.consumerSecret);
            }
            if ($('input[key="oauth_token_secret"]').val() != '') {
                accessor.tokenSecret = $('input[key="oauth_token_secret"]').val();
                accessor.tokenSecret = pm.envManager.convertString(accessor.tokenSecret);
            }

            return OAuth.SignatureMethod.sign(message, accessor);
        },

        removeOAuthKeys:function (params) {
            var i, count;
            var oauthParams = [
                "oauth_consumer_key",
                "oauth_token",
                "oauth_signature_method",
                "oauth_timestamp",
                "oauth_nonce",
                "oauth_version",
                "oauth_signature"
            ];

            var newParams = [];
            var oauthIndexes = [];
            for (i = 0, count = params.length; i < count; i++) {
                var index = _.indexOf(oauthParams, params[i].key);
                if (index < 0) {
                    newParams.push(params[i]);
                }
            }

            return newParams;
        },

        process:function () {
            var i, count, length;
            var params = [];
            var urlParams = pm.request.getUrlEditorParams();
            var bodyParams = [];

            if (pm.request.body.mode === "params") {
                bodyParams = $('#formdata-keyvaleditor').keyvalueeditor('getValues');
            }
            else if (pm.request.body.mode === "urlencoded") {
                bodyParams = $('#urlencoded-keyvaleditor').keyvalueeditor('getValues');
            }

            params = params.concat(urlParams);
            params = params.concat(bodyParams);

            params = pm.helpers.oAuth1.removeOAuthKeys(params);
            var signatureKey = "oauth_signature";

            $('input.signatureParam').each(function () {
                if ($(this).val() != '') {
                    var val = $(this).val();
                    params.push({key:$(this).attr('key'), value:val});
                }
            });

            //Convert environment values
            for (i = 0, length = params.length; i < length; i++) {
                params[i].value = pm.envManager.convertString(params[i].value);
            }

            var signature = this.generateSignature();

            if (signature == null) {
                return;
            }

            params.push({key:signatureKey, value:signature});

            var addToHeader = $('#request-helper-oauth1-header').attr('checked') ? true : false;

            if (addToHeader) {
                var realm = pm.envManager.convertString($('#url').val()).trim();
                if (realm.indexOf('?') > 0) {
                    realm = realm.split("?")[0];
                }
                var headers = pm.request.headers;
                var authHeaderKey = "Authorization";
                var pos = findPosition(headers, "key", authHeaderKey);

                var rawString = "OAuth realm=\"" + realm + "\",";
                var len = params.length;
                for (i = 0; i < len; i++) {
                    rawString += encodeURIComponent(params[i].key) + "=\"" + encodeURIComponent(params[i].value) + "\",";
                }
                rawString = rawString.substring(0, rawString.length - 1);

                if (pos >= 0) {
                    headers[pos] = {
                        key:authHeaderKey,
                        name:authHeaderKey,
                        value:rawString
                    };
                }
                else {
                    headers.push({key:authHeaderKey, name:authHeaderKey, value:rawString});
                }

                pm.request.headers = headers;
                $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
                pm.request.openHeaderEditor();
            } else {
                if (pm.request.method === "GET") {
                    $('#url-keyvaleditor').keyvalueeditor('reset', params);
                    pm.request.setUrlParamString(params);
                    pm.request.openUrlEditor();
                } else {
                    var dataMode = pm.request.body.getDataMode();
                    if (dataMode === 'urlencoded') {
                        $('#urlencoded-keyvaleditor').keyvalueeditor('reset', params);
                    }
                    else if (dataMode === 'params') {
                        $('#formdata-keyvaleditor').keyvalueeditor('reset', params);
                    }
                }
            }
        }
    }
};
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
            pm.request.loadRequestInEditor(request);
        });
    },

    addRequest:function (url, method, headers, data, dataMode) {
        console.log(data);
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
pm.indexedDB = {
    TABLE_HEADER_PRESETS: "header_presets",

    onerror:function (event, callback) {
        console.log(event);
    },

    open_v21:function () {

        var request = indexedDB.open("postman", "POSTman request history");
        request.onsuccess = function (e) {
            var v = "0.6";
            pm.indexedDB.db = e.target.result;
            var db = pm.indexedDB.db;

            //We can only create Object stores in a setVersion transaction
            if (v !== db.version) {
                var setVrequest = db.setVersion(v);

                setVrequest.onfailure = function (e) {
                    console.log(e);
                };

                setVrequest.onsuccess = function (event) {
                    //Only create if does not already exist
                    if (!db.objectStoreNames.contains("requests")) {
                        var requestStore = db.createObjectStore("requests", {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains("collections")) {
                        var collectionsStore = db.createObjectStore("collections", {keyPath:"id"});
                        collectionsStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    if (!db.objectStoreNames.contains("collection_requests")) {
                        var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath:"id"});
                        collectionRequestsStore.createIndex("timestamp", "timestamp", { unique:false});
                        collectionRequestsStore.createIndex("collectionId", "collectionId", { unique:false});
                    }

                    if (db.objectStoreNames.contains("collection_responses")) {
                        db.deleteObjectStore("collection_responses");
                    }

                    if (!db.objectStoreNames.contains("environments")) {
                        var environmentsStore = db.createObjectStore("environments", {keyPath:"id"});
                        environmentsStore.createIndex("timestamp", "timestamp", { unique:false});
                        environmentsStore.createIndex("id", "id", { unique:false});
                    }

                    if (!db.objectStoreNames.contains("header_presets")) {
                        var requestStore = db.createObjectStore("header_presets", {keyPath:"id"});
                        requestStore.createIndex("timestamp", "timestamp", { unique:false});
                    }

                    var transaction = event.target.result;
                    transaction.oncomplete = function () {
                        pm.history.getAllRequests();
                        pm.envManager.getAllEnvironments();
                        pm.headerPresets.init();
                    };
                };

                setVrequest.onupgradeneeded = function (evt) {
                };
            }
            else {
                pm.history.getAllRequests();
                pm.envManager.getAllEnvironments();
                pm.headerPresets.init();
            }

        };

        request.onfailure = pm.indexedDB.onerror;
    },

    open_latest:function () {

        var v = 11;
        var request = indexedDB.open("postman", v);        
        request.onupgradeneeded = function (e) {

            var db = e.target.result;
            pm.indexedDB.db = db;
            if (!db.objectStoreNames.contains("requests")) {
                var requestStore = db.createObjectStore("requests", {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains("collections")) {
                var collectionsStore = db.createObjectStore("collections", {keyPath:"id"});
                collectionsStore.createIndex("timestamp", "timestamp", { unique:false});
            }

            if (!db.objectStoreNames.contains("collection_requests")) {
                var collectionRequestsStore = db.createObjectStore("collection_requests", {keyPath:"id"});
                collectionRequestsStore.createIndex("timestamp", "timestamp", { unique:false});
                collectionRequestsStore.createIndex("collectionId", "collectionId", { unique:false});
            }

            if (db.objectStoreNames.contains("collection_responses")) {
                db.deleteObjectStore("collection_responses");
            }

            if (!db.objectStoreNames.contains("environments")) {
                var environmentsStore = db.createObjectStore("environments", {keyPath:"id"});
                environmentsStore.createIndex("timestamp", "timestamp", { unique:false});
                environmentsStore.createIndex("id", "id", { unique:false});
            }

            if (!db.objectStoreNames.contains("header_presets")) {
                var requestStore = db.createObjectStore("header_presets", {keyPath:"id"});
                requestStore.createIndex("timestamp", "timestamp", { unique:false});
            }
        };

        request.onsuccess = function (e) {
            pm.indexedDB.db = e.target.result;
            pm.history.getAllRequests();
            pm.envManager.getAllEnvironments();
            pm.headerPresets.init();
        };

        request.onerror = pm.indexedDB.onerror;
    },

    open:function () {
        if (parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) < 23) {
            pm.indexedDB.open_v21();
        }
        else {
            pm.indexedDB.open_latest();
        }
    },

    addCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        var request;

        if("order" in collection) {
            request = store.put({
                "id":collection.id,
                "name":collection.name,
                "order":collection.order,
                "timestamp":new Date().getTime()
            });
        }
        else {
            request = store.put({
                "id":collection.id,
                "name":collection.name,
                "timestamp":new Date().getTime()
            });
        }
        

        request.onsuccess = function () {
            callback(collection);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    updateCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        var boundKeyRange = IDBKeyRange.only(collection.id);
        var request = store.put(collection);

        request.onsuccess = function (e) {
            callback(collection);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    addCollectionRequest:function (req, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        var version;

        if ("version" in req) {
            version = req.version;
        }
        else {
            version = 1;
        }
        
        var collectionRequest = store.put({
            "collectionId":req.collectionId,
            "id":req.id,
            "name":req.name,
            "description":req.description,
            "url":req.url.toString(),
            "method":req.method.toString(),
            "headers":req.headers.toString(),
            "data":req.data,
            "dataMode":req.dataMode.toString(),
            "timestamp":req.timestamp,
            "responses":req.responses,
            "version":req.version
        });

        collectionRequest.onsuccess = function () {
            callback(req);
        };

        collectionRequest.onerror = function (e) {
            console.log(e.value);
        };
    },

    updateCollectionRequest:function (req, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        var boundKeyRange = IDBKeyRange.only(req.id);
        var request = store.put(req);

        request.onsuccess = function (e) {
            callback(req);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    getCollection:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            callback(result);
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    getCollections:function (callback) {
        var db = pm.indexedDB.db;

        if (db == null) {
            return;
        }

        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore("collections");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var cursorRequest = store.openCursor(keyRange);
        var numCollections = 0;
        var items = [];
        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                callback(items);
                return;
            }

            var collection = result.value;
            numCollections++;

            items.push(collection);

            result['continue']();
        };

        cursorRequest.onerror = function (e) {
            console.log(e);
        };
    },

    getAllRequestsInCollection:function (collection, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");

        //Get everything in the store
        var keyRange = IDBKeyRange.only(collection.id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        var requests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(collection, requests);
                return;
            }

            var request = result.value;
            requests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    addRequest:function (historyRequest, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["requests"], "readwrite");
        var store = trans.objectStore("requests");
        var request = store.put(historyRequest);

        request.onsuccess = function (e) {
            callback(historyRequest);
        };

        request.onerror = function (e) {
            console.log(e.value);
        };
    },

    getRequest:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["requests"], "readwrite");
        var store = trans.objectStore("requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            callback(result);
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    getCollectionRequest:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore("collection_requests");

        //Get everything in the store
        var cursorRequest = store.get(id);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;
            if (!result) {
                return;
            }

            callback(result);
            return result;
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },


    getAllRequestItems:function (callback) {
        var db = pm.indexedDB.db;
        if (db == null) {
            return;
        }

        var trans = db.transaction(["requests"], "readwrite");
        var store = trans.objectStore("requests");

        //Get everything in the store
        var keyRange = IDBKeyRange.lowerBound(0);
        var index = store.index("timestamp");
        var cursorRequest = index.openCursor(keyRange);
        var historyRequests = [];

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                callback(historyRequests);
                return;
            }

            var request = result.value;
            historyRequests.push(request);

            //This wil call onsuccess again and again until no more request is left
            result['continue']();
        };

        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    deleteRequest:function (id, callback) {
        try {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["requests"], "readwrite");
            var store = trans.objectStore(["requests"]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        }
        catch (e) {
            console.log(e);
        }
    },

    deleteHistory:function (callback) {
        var db = pm.indexedDB.db;
        var clearTransaction = db.transaction(["requests"], "readwrite");
        var clearRequest = clearTransaction.objectStore(["requests"]).clear();
        clearRequest.onsuccess = function (event) {
            callback();
        };
    },

    deleteCollectionRequest:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");
        var store = trans.objectStore(["collection_requests"]);

        var request = store['delete'](id);

        request.onsuccess = function (e) {
            callback(id);
        };

        request.onerror = function (e) {
            console.log(e);
        };
    },

    deleteAllCollectionRequests:function (id) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collection_requests"], "readwrite");

        //Get everything in the store
        var keyRange = IDBKeyRange.only(id);
        var store = trans.objectStore("collection_requests");

        var index = store.index("collectionId");
        var cursorRequest = index.openCursor(keyRange);

        cursorRequest.onsuccess = function (e) {
            var result = e.target.result;

            if (!result) {
                return;
            }

            var request = result.value;
            pm.collections.deleteCollectionRequest(request.id);
            result['continue']();
        };
        cursorRequest.onerror = pm.indexedDB.onerror;
    },

    deleteCollection:function (id, callback) {
        var db = pm.indexedDB.db;
        var trans = db.transaction(["collections"], "readwrite");
        var store = trans.objectStore(["collections"]);

        var request = store['delete'](id);

        request.onsuccess = function () {
            pm.indexedDB.deleteAllCollectionRequests(id);
            callback(id);
        };

        request.onerror = function (e) {
            console.log(e);
        };
    },

    environments:{
        addEnvironment:function (environment, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");
            var request = store.put(environment);

            request.onsuccess = function (e) {
                callback(environment);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getEnvironment:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };
            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        deleteEnvironment:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore(["environments"]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getAllEnvironments:function (callback) {
            var db = pm.indexedDB.db;
            if (db == null) {
                return;
            }

            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var environments = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    callback(environments);
                    return;
                }

                var request = result.value;
                environments.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateEnvironment:function (environment, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction(["environments"], "readwrite");
            var store = trans.objectStore("environments");

            var boundKeyRange = IDBKeyRange.only(environment.id);
            var request = store.put(environment);

            request.onsuccess = function (e) {
                callback(environment);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        }
    },

    headerPresets:{
        addHeaderPreset:function (headerPreset, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);
            var request = store.put(headerPreset);

            request.onsuccess = function (e) {
                callback(headerPreset);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getHeaderPreset:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);

            //Get everything in the store
            var cursorRequest = store.get(id);

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;
                callback(result);
            };
            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        deleteHeaderPreset:function (id, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore([pm.indexedDB.TABLE_HEADER_PRESETS]);

            var request = store['delete'](id);

            request.onsuccess = function () {
                callback(id);
            };

            request.onerror = function (e) {
                console.log(e);
            };
        },

        getAllHeaderPresets:function (callback) {
            var db = pm.indexedDB.db;
            if (db == null) {
                console.log("Db is null");
                return;
            }

            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);

            //Get everything in the store
            var keyRange = IDBKeyRange.lowerBound(0);
            var index = store.index("timestamp");
            var cursorRequest = index.openCursor(keyRange);
            var headerPresets = [];

            cursorRequest.onsuccess = function (e) {
                var result = e.target.result;

                if (!result) {
                    callback(headerPresets);
                    return;
                }

                var request = result.value;
                headerPresets.push(request);

                //This wil call onsuccess again and again until no more request is left
                result['continue']();
            };

            cursorRequest.onerror = pm.indexedDB.onerror;
        },

        updateHeaderPreset:function (headerPreset, callback) {
            var db = pm.indexedDB.db;
            var trans = db.transaction([pm.indexedDB.TABLE_HEADER_PRESETS], "readwrite");
            var store = trans.objectStore(pm.indexedDB.TABLE_HEADER_PRESETS);

            var boundKeyRange = IDBKeyRange.only(headerPreset.id);
            var request = store.put(headerPreset);

            request.onsuccess = function (e) {
                callback(headerPreset);
            };

            request.onerror = function (e) {
                console.log(e.value);
            };
        }
    }
};
pm.jsonlint = {
    instance: null,
    
    init: function() {
      pm.jsonlint.instance = jsonlint_postman;
      jsonlint_postman = null;
    }
};

pm.keymap = {
    init:function () {
        var clearHistoryHandler = function () {
            if(pm.layout.isModalOpen) return;

            pm.history.clear();
            return false;
        };

        var urlFocusHandler = function () {
            if(pm.layout.isModalOpen) return;

            $('#url').focus();
            return false;
        };

        var newRequestHandler = function () {
            if(pm.layout.isModalOpen) return;

            pm.request.startNew();
        };

        $('body').on('keydown', 'input', function (event) {
            if(pm.layout.isModalOpen) return;

            if (event.keyCode === 27) {
                $(event.target).blur();
            }
            else if (event.keyCode == 13) {
                pm.request.send("text");
            }

            return true;
        });

        $('body').on('keydown', 'textarea', function (event) {            
            if(pm.layout.isModalOpen) return;

            if (event.keyCode === 27) {
                $(event.target).blur();
            }
        });

        $('body').on('keydown', 'select', function (event) {
            if (event.keyCode === 27) {
                $(event.target).blur();
            }
        });

        $(document).bind('keydown', 'alt+c', clearHistoryHandler);
        $(document).bind('keydown', 'backspace', urlFocusHandler);
        $(document).bind('keydown', 'alt+n', newRequestHandler);

        $(document).bind('keydown', 'q', function () {            
            pm.envManager.quicklook.toggleDisplay();
            return false;
        });

        $(document).bind('keydown', 'e', function () {
            if(pm.layout.isModalOpen) return;

            $('#modal-environments').modal({
                keyboard:true,
                backdrop:"static"
            });
        });


        $(document).bind('keydown', 'h', function () {
            if(pm.layout.isModalOpen) return;

            pm.request.openHeaderEditor();
            $('#headers-keyvaleditor div:first-child input:first-child').focus();
            return false;
        });

        $(document).bind('keydown', 'return', function () {
            if(pm.layout.isModalOpen) return;

            pm.request.send("text");
            return false;
        });

        $(document).bind('keydown', 'p', function () {
            if(pm.layout.isModalOpen) return;

            if (pm.request.isMethodWithBody(pm.request.method)) {
                $('#formdata-keyvaleditor div:first-child input:first-child').focus();
                return false;
            }
        });

        $(document).bind('keydown', 'f', function () {
            if(pm.layout.isModalOpen) return;

            pm.request.response.toggleBodySize();
        });

        $(document).bind('keydown', 'esc', function () {
            if(pm.layout.isModalOpen) {
                var activeModal = pm.layout.activeModal;
                if(activeModal !== "") {
                    $(activeModal).modal("hide");
                }
            }
        });

        $(document).bind('keydown', 'shift+/', function () {
            if(pm.layout.isModalOpen) return;

            $('#modal-shortcuts').modal({
                keyboard: true
            });

            $('#modal-shortcuts').modal('show');
        });

        $(document).bind('keydown', 'a', function () {
            if(pm.layout.isModalOpen) return;
            
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }

            $('#modal-add-to-collection').modal({
                keyboard:true,
                backdrop:"static"
            });
            $('#modal-add-to-collection').modal('show');

            $('#new-request-name').val("");
            $('#new-request-description').val("");
            return false;
        });
    }
};
pm.layout = {
    isModalOpen:false,
    activeModal: "",

    socialButtons:{
        "facebook":'<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Ffdmmgilgnpjigdojojpjoooidkmcomcm&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;appId=26438002524" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>',
        "twitter":'<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm" data-text="I am using Postman to super-charge REST API testing and development!" data-count="horizontal" data-via="postmanclient">Tweet</a><script type="text/javascript" src="https://platform.twitter.com/widgets.js"></script>',
        "plusOne":'<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script><g:plusone size="medium" href="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm"></g:plusone>'
    },

    detectLauncher: function() {
        if(pm.debug) {
            return;    
        }

        var launcherNotificationCount = pm.settings.get("launcherNotificationCount");        
        var maxCount = 1;
        if(launcherNotificationCount >= 1) {
            return true;
        }        

        var extension_id = "igofndmniooofoabmmpfonmdnhgchoka";
        var extension_url = "https://chrome.google.com/webstore/detail/" + extension_id;        
        
        noty(
        {
            type:'information',
            text:"Click here to get the Postman Launcher for quick access to Postman from the Chrome toolbar",
            layout:'topRight',
            callback: {
                onClose: function() {
                    var url = "https://chrome.google.com/webstore/detail/postman-launcher/igofndmniooofoabmmpfonmdnhgchoka";
                    window.open(url, '_blank');
                    window.focus();
                }
            }            
        });        

        var launcherNotificationCount = parseInt(pm.settings.get("launcherNotificationCount")) + 1;        
        pm.settings.set("launcherNotificationCount", launcherNotificationCount);       
    },

    init:function () {
        pm.layout.detectLauncher()   

        $('#make-postman-better').on("click", function () {
            $('#modal-spread-the-word').modal('show');
            pm.layout.attachSocialButtons();
        });

        $('#donate').on("click", function () {
            $('#donate-form form').submit();
        });

        $('#donate').popover({
            animation: true,
            content: "Please donate $5 only if you like Postman! This will help a lot in the development and maintenance of the project.",
            placement: "top",
            trigger: "hover",
            title: "Donate"
        });

        $('#response-body-toggle').on("click", function () {
            pm.request.response.toggleBodySize();
        });

        $('#response-body-line-wrapping').on("click", function () {
            pm.editor.toggleLineWrapping();
            return true;
        });

        $('#response-open-in-new-window').on("click", function () {
            var data = pm.request.response.text;
            pm.request.response.openInNewWindow(data);
        });


        $('#response-formatting').on("click", "a", function () {
            var previewType = $(this).attr('data-type');
            pm.request.response.changePreviewType(previewType);
        });

        $('#response-language').on("click", "a", function () {
            var language = $(this).attr("data-mode");
            pm.request.response.setMode(language);
        });

        $('#response-sample-save-start').on("click", function () {
            $('#response-sample-save-start-container').css("display", "none");
            $('#response-sample-save-form').css("display", "inline-block");
        });

        $('#response-sample-cancel').on("click", function () {
            $('#response-sample-save-start-container').css("display", "inline-block");
            $('#response-sample-save-form').css("display", "none");
        });

        $('#response-sample-save').on("click", function () {
            var url = $('#url').val();

            var currentResponse = pm.request.response;
            var request = new CollectionRequest();
            request.id = guid();
            request.headers = pm.request.getPackedHeaders();
            request.url = url;
            request.method = pm.request.method;
            request.data = pm.request.body.getData();
            request.dataMode = pm.request.dataMode;
            request.time = new Date().getTime();

            var name = $("#response-sample-name").val();

            var response = {
                "id":guid(),
                "name":name,
                "collectionRequestId":pm.request.collectionRequestId,
                "request":request,
                "responseCode":currentResponse.responseCode,
                "time":currentResponse.time,
                "headers":currentResponse.headers,
                "cookies":currentResponse.cookies,
                "text":currentResponse.text
            };

            pm.collections.saveResponseAsSample(response);

            $('#response-sample-save-start-container').css("display", "inline-block");
            $('#response-sample-save-form').css("display", "none");
        });

        this.sidebar.init();

        pm.request.response.clear();

        $('#sidebar-selectors li a').click(function () {
            var id = $(this).attr('data-id');
            pm.layout.sidebar.select(id);
        });

        $('a[rel="tooltip"]').tooltip();
        $('input[rel="popover"]').popover();

        $('#form-add-to-collection').submit(function () {
            pm.collections.addRequestToCollection();
            $('#modal-add-to-collection').modal('hide');
            return false;
        });

        $('#modal-add-to-collection .btn-primary').click(function () {
            pm.collections.addRequestToCollection();
            $('#modal-add-to-collection').modal('hide');
        });

        $('#form-new-collection').submit(function () {
            pm.collections.addCollection();
            return false;
        });

        $('#modal-new-collection .btn-primary').click(function () {
            pm.collections.addCollection();
            return false;
        });

        $('#modal-edit-collection .btn-primary').click(function () {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();

            pm.indexedDB.getCollection(id, function (collection) {
                collection.name = name;
                pm.indexedDB.updateCollection(collection, function (collection) {
                    $('#form-edit-collection .collection-name').val("");
                    $('#form-edit-collection .collection-id').val("");
                    $('#collection-' + collection.id + " .sidebar-collection-head-name").html(collection.name);
                    $('#select-collection option[value="' + collection.id + '"]').html(collection.name);
                });
            });

            $('#modal-edit-collection').modal('hide');
        });

        $('#modal-edit-collection-request .btn-primary').click(function () {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();

            pm.indexedDB.getCollectionRequest(id, function (req) {
                req.name = name;
                req.description = description;
                pm.indexedDB.updateCollectionRequest(req, function (newRequest) {
                    var requestName;
                    if (req.name != undefined) {
                        requestName = limitStringLineWidth(req.name, 43);
                    }
                    else {
                        requestName = limitStringLineWidth(req.url, 43);
                    }

                    $('#sidebar-request-' + req.id + " .request .request-name").html(requestName);
                    if (pm.request.collectionRequestId === req.id) {
                        $('#request-name').html(req.name);
                        $('#request-description').html(req.description);
                    }
                    $('#modal-edit-collection-request').modal('hide');
                });
            });
        });

        $(window).resize(function () {
            pm.layout.setLayout();
        });

        $('#response-data').on("click", ".cm-link", function () {
            var link = $(this).html();
            var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
            pm.request.loadRequestFromLink(link, headers);
        });

        $('.response-tabs').on("click", "li", function () {
            var section = $(this).attr('data-section');
            if (section === "body") {
                pm.request.response.showBody();
            }
            else if (section === "headers") {
                pm.request.response.showHeaders();
            }
            else if (section === "cookies") {
                pm.request.response.showCookies();
            }
        });

        $('#request-meta').on("mouseenter", function () {
            $('.request-meta-actions').css("display", "block");
        });

        $('#request-meta').on("mouseleave", function () {
            $('.request-meta-actions').css("display", "none");
        });

        this.attachModalHandlers();
        this.setLayout();
    },

    onModalOpen:function (activeModal) {
        pm.layout.activeModal = activeModal;
        pm.layout.isModalOpen = true;
    },

    onModalClose:function () {
        pm.layout.activeModal = "";
        pm.layout.isModalOpen = false;
    },

    attachModalHandlers:function () {
        $("#modal-new-collection").on("shown", function () {
            $("#new-collection-blank").focus();
            pm.layout.onModalOpen("#modal-new-collection");
        });

        $("#modal-new-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-edit-collection").on("shown", function () {
            $("#modal-edit-collection .collection-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection");
        });

        $("#modal-edit-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-edit-collection-request").on("shown", function () {
            $("#modal-edit-collection-request .collection-request-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection-request");
        });

        $("#modal-edit-collection-request").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-add-to-collection").on("shown", function () {
            $("#select-collection").focus();
            pm.layout.onModalOpen("#modal-add-to-collection");
        });

        $("#modal-add-to-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-share-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-share-collection");
        });

        $("#modal-share-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-import-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-import-collection");
        });

        $("#modal-import-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-delete-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-delete-collection");
        });

        $("#modal-delete-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-environments").on("shown", function () {
            $('.environments-actions-add').focus();
            pm.layout.onModalOpen("#modal-environments");
        });

        $("#modal-environments").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-header-presets").on("shown", function () {
            $(".header-presets-actions-add").focus();
            pm.layout.onModalOpen("#modal-header-presets");
        });

        $("#modal-header-presets").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-settings").on("shown", function () {
            $("#history-count").focus();
            pm.layout.onModalOpen("#modal-settings");
        });

        $("#modal-settings").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-spread-the-word").on("shown", function () {
            pm.layout.onModalOpen("#modal-spread-the-word");
        });

        $("#modal-spread-the-word").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-shortcuts").on("shown", function () {
            pm.layout.onModalOpen("#modal-shortcuts");
        });

        $("#modal-shortcuts").on("hidden", function () {
            pm.layout.onModalClose();
        });
    },

    attachSocialButtons:function () {
        var currentContent = $("#about-postman-twitter-button").html();
        if (currentContent === "" || !currentContent) {
            $('#about-postman-twitter-button').html(this.socialButtons.twitter);
        }

        currentContent = $("#about-postman-plus-one-button").html();
        if (currentContent === "" || !currentContent) {
            $("#about-postman-plus-one-button").html(this.socialButtons.plusOne);
        }

        currentContent = $('#about-postman-facebook-button').html();
        if (currentContent === "" || !currentContent) {
            $("#about-postman-facebook-button").html(this.socialButtons.facebook);
        }
    },

    setLayout:function () {
        this.refreshScrollPanes();        
    },

    refreshScrollPanes:function () {
        var newMainWidth = $('#container').width() - $('#sidebar').width();
        $('#main').width(newMainWidth + "px");

        if ($('#sidebar').width() > 100) {
            $('#sidebar').jScrollPane({
                mouseWheelSpeed:24
            });
        }

    },

    sidebar:{
        currentSection:"history",
        isSidebarMaximized:true,
        sections:[ "history", "collections" ],
        width:0,
        animationDuration:250,

        minimizeSidebar:function () {
            var animationDuration = pm.layout.sidebar.animationDuration;
            $('#sidebar-toggle').animate({left:"0"}, animationDuration);
            $('#sidebar').animate({width:"5px"}, animationDuration);
            $('#sidebar-footer').css("display", "none");
            $('#sidebar div').animate({opacity:0}, animationDuration);
            var newMainWidth = $(document).width() - 5;
            $('#main').animate({width:newMainWidth + "px", "margin-left":"5px"}, animationDuration);
            $('#sidebar-toggle img').attr('src', 'img/tri_arrow_right.png');
        },

        maximizeSidebar:function () {
            var animationDuration = pm.layout.sidebar.animationDuration;
            $('#sidebar-toggle').animate({left:"350px"}, animationDuration, function () {
                $('#sidebar-footer').fadeIn();
            });
            $('#sidebar').animate({width:pm.layout.sidebar.width + "px"}, animationDuration);
            $('#sidebar div').animate({opacity:1}, animationDuration);
            $('#sidebar-toggle img').attr('src', 'img/tri_arrow_left.png');
            var newMainWidth = $(document).width() - pm.layout.sidebar.width;
            $('#main').animate({width:newMainWidth + "px", "margin-left":pm.layout.sidebar.width + "px"}, animationDuration);
            pm.layout.refreshScrollPanes();
        },

        toggleSidebar:function () {
            var isSidebarMaximized = pm.layout.sidebar.isSidebarMaximized;
            if (isSidebarMaximized) {
                pm.layout.sidebar.minimizeSidebar();
            }
            else {
                pm.layout.sidebar.maximizeSidebar();
            }

            pm.layout.sidebar.isSidebarMaximized = !isSidebarMaximized;
        },

        init:function () {
            $('#history-items').on("click", ".request-actions-delete", function () {
                var request_id = $(this).attr('data-request-id');
                pm.history.deleteRequest(request_id);
            });

            $('#history-items').on("click", ".request", function () {
                var request_id = $(this).attr('data-request-id');
                pm.history.loadRequest(request_id);
            });

            $('#sidebar-toggle').on("click", function () {
                pm.layout.sidebar.toggleSidebar();
            });

            pm.layout.sidebar.width = $('#sidebar').width() + 10;

            this.addRequestListeners();
        },

        select:function (section) {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }

            $('#sidebar-section-' + this.currentSection).css("display", "none");
            $('#' + this.currentSection + '-options').css("display", "none");

            this.currentSection = section;

            $('#sidebar-section-' + section).fadeIn();
            $('#' + section + '-options').css("display", "block");
            pm.layout.refreshScrollPanes();
            return true;
        },

        addRequest:function (url, method, id, position) {
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

            if (position === 'top') {
                $('#history-items').prepend(Handlebars.templates.item_history_sidebar_request(request));
            }
            else {
                $('#history-items').append(Handlebars.templates.item_history_sidebar_request(request));
            }

            $('#sidebar-section-history .empty-message').css("display", "none");
            pm.layout.refreshScrollPanes();
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

        removeRequestFromHistory:function (id, toAnimate) {
            if (toAnimate) {
                $('#sidebar-request-' + id).slideUp(100);
            }
            else {
                $('#sidebar-request-' + id).remove();
            }

            if (pm.history.requests.length === 0) {
                pm.history.showEmptyMessage();
            }
            else {
                pm.history.hideEmptyMessage();
            }

            pm.layout.refreshScrollPanes();
        },

        removeCollection:function (id) {
            $('#collection-' + id).remove();
            pm.layout.refreshScrollPanes();
        }
    }
};
pm.request = {
    url:"",
    urlParams:{},
    name:"",
    description:"",
    bodyParams:{},
    headers:[],
    method:"GET",
    dataMode:"params",
    isFromCollection:false,
    collectionRequestId:"",
    methodsWithBody:["POST", "PUT", "PATCH", "DELETE", "LINK", "UNLINK"],
    areListenersAdded:false,
    startTime:0,
    endTime:0,
    xhr:null,
    editorMode:0,
    responses:[],

    body:{
        mode:"params",
        data:"",
        isEditorInitialized:false,
        codeMirror:false,

        init:function () {
            this.initFormDataEditor();
            this.initUrlEncodedEditor();
            this.initEditorListeners();
        },

        hide:function () {
            pm.request.body.closeFormDataEditor();
            pm.request.body.closeUrlEncodedEditor();
            $("#data").css("display", "none");
        },

        getRawData:function () {
            if (pm.request.body.isEditorInitialized) {
                return pm.request.body.codeMirror.getValue();
            }
            else {
                return "";
            }
        },

        loadRawData:function (data) {
            var body = pm.request.body;

            if (body.isEditorInitialized === true) {
                body.codeMirror.setValue(data);
                body.codeMirror.refresh();
            }
        },

        initCodeMirrorEditor:function () {
            pm.request.body.isEditorInitialized = true;
            var bodyTextarea = document.getElementById("body");
            pm.request.body.codeMirror = CodeMirror.fromTextArea(bodyTextarea,
            {
                mode:"htmlmixed",
                lineNumbers:true,
                theme:'eclipse'
            });


            $("#request .CodeMirror").resizable({
                stop: function() { pm.request.body.codeMirror.refresh(); },
                resize: function(event, ui) {
                    ui.size.width = ui.originalSize.width;
                    $(".CodeMirror-scroll").height($(this).height());                    
                    pm.request.body.codeMirror.refresh();
                }
            });

            $("#request .CodeMirror-scroll").css("height", "200px");
            pm.request.body.codeMirror.refresh();
        },

        setEditorMode:function (mode, language) {
            var displayMode = $("#body-editor-mode-selector a[data-language='" + language + "']").html();
            $('#body-editor-mode-item-selected').html(displayMode);

            if (pm.request.body.isEditorInitialized) {
                if (mode === "javascript") {
                    pm.request.body.codeMirror.setOption("mode", {"name":"javascript", "json":true});
                }
                else {
                    pm.request.body.codeMirror.setOption("mode", mode);
                }

                if (mode === "text") {
                  $('#body-editor-mode-selector-format').addClass('disabled');
                } else {
                  $('#body-editor-mode-selector-format').removeClass('disabled');
                }

                //pm.request.body.autoFormatEditor(mode);
                pm.request.body.codeMirror.refresh();
            }
        },

        autoFormatEditor:function (mode) {
          var content = pm.request.body.codeMirror.getValue(),
              validated = null, result = null;
          
          $('#body-editor-mode-selector-format-result').empty().hide();
          
          if (pm.request.body.isEditorInitialized) {
            
            // In case its a JSON then just properly stringify it.
            // CodeMirror does not work well with pure JSON format.
            if (mode === 'javascript') {
              
              // Validate code first.
              try {
                validated = pm.jsonlint.instance.parse(content);
                if (validated) {
                  content = JSON.parse(pm.request.body.codeMirror.getValue());
                  pm.request.body.codeMirror.setValue(JSON.stringify(content, null, 4));
                }
              } catch(e) {
                result = e.message;
                // Show jslint result.
                // We could also highlight the line with error here.
                $('#body-editor-mode-selector-format-result').html(result).show();
              }
            } else { // Otherwise use internal CodeMirror.autoFormatRage method for a specific mode.
              var totalLines = pm.request.body.codeMirror.lineCount(),
                  totalChars = pm.request.body.codeMirror.getValue().length;
              
              pm.request.body.codeMirror.autoFormatRange(
                {line: 0, ch: 0}, 
                {line: totalLines - 1, ch: pm.request.body.codeMirror.getLine(totalLines - 1).length}
              );
            }
          }
        },

        initFormDataEditor:function () {
            var editorId = "#formdata-keyvaleditor";

            var params = {
                placeHolderKey:"Key",
                placeHolderValue:"Value",
                valueTypes:["text", "file"],
                deleteButton:'<img class="deleteButton" src="img/delete.png">',
                onDeleteRow:function () {
                },

                onBlurElement:function () {
                }
            };

            $(editorId).keyvalueeditor('init', params);
        },

        initUrlEncodedEditor:function () {
            var editorId = "#urlencoded-keyvaleditor";

            var params = {
                placeHolderKey:"Key",
                placeHolderValue:"Value",
                valueTypes:["text"],
                deleteButton:'<img class="deleteButton" src="img/delete.png">',
                onDeleteRow:function () {
                },

                onBlurElement:function () {
                }
            };

            $(editorId).keyvalueeditor('init', params);
        },

        initEditorListeners:function () {
            $('#body-editor-mode-selector .dropdown-menu').on("click", "a", function (event) {
                var editorMode = $(event.target).attr("data-editor-mode");
                var language = $(event.target).attr("data-language");
                pm.request.body.setEditorMode(editorMode, language);
            });
            
            // 'Format code' button listener.
            $('#body-editor-mode-selector-format').on('click.postman', function(evt) {
              var editorMode = $(event.target).attr("data-editor-mode");

              if ($(evt.currentTarget).hasClass('disabled')) {
                return;
              }

              //pm.request.body.autoFormatEditor(pm.request.body.codeMirror.getMode().name);
            });
        },

        openFormDataEditor:function () {
            var containerId = "#formdata-keyvaleditor-container";
            $(containerId).css("display", "block");

            var editorId = "#formdata-keyvaleditor";
            var params = $(editorId).keyvalueeditor('getValues');
            var newParams = [];
            for (var i = 0; i < params.length; i++) {
                var param = {
                    key:params[i].key,
                    value:params[i].value
                };

                newParams.push(param);
            }
        },

        closeFormDataEditor:function () {
            var containerId = "#formdata-keyvaleditor-container";
            $(containerId).css("display", "none");
        },

        openUrlEncodedEditor:function () {
            var containerId = "#urlencoded-keyvaleditor-container";
            $(containerId).css("display", "block");

            var editorId = "#urlencoded-keyvaleditor";
            var params = $(editorId).keyvalueeditor('getValues');
            var newParams = [];
            for (var i = 0; i < params.length; i++) {
                var param = {
                    key:params[i].key,
                    value:params[i].value
                };

                newParams.push(param);
            }
        },

        closeUrlEncodedEditor:function () {
            var containerId = "#urlencoded-keyvaleditor-container";
            $(containerId).css("display", "none");
        },

        setDataMode:function (mode) {
            pm.request.dataMode = mode;
            pm.request.body.mode = mode;
            $('#data-mode-selector a').removeClass("active");
            $('#data-mode-selector a[data-mode="' + mode + '"]').addClass("active");

            $("#body-editor-mode-selector").css("display", "none");
            if (mode === "params") {
                pm.request.body.openFormDataEditor();
                pm.request.body.closeUrlEncodedEditor();
                $('#body-data-container').css("display", "none");
            }
            else if (mode === "raw") {
                pm.request.body.closeUrlEncodedEditor();
                pm.request.body.closeFormDataEditor();
                $('#body-data-container').css("display", "block");

                if (pm.request.body.isEditorInitialized === false) {
                    pm.request.body.initCodeMirrorEditor();
                }
                else {
                    pm.request.body.codeMirror.refresh();
                }
                $("#body-editor-mode-selector").css("display", "block");
            }
            else if (mode === "urlencoded") {
                pm.request.body.closeFormDataEditor();
                pm.request.body.openUrlEncodedEditor();
                $('#body-data-container').css("display", "none");
            }
        },

        getDataMode:function () {
            return pm.request.body.mode;
        },

        //Be able to return direct keyvaleditor params
        getData:function (asObjects) {
            var data;
            var mode = pm.request.body.mode;
            var params;
            var newParams;
            var param;
            var i;

            if (mode === "params") {
                params = $('#formdata-keyvaleditor').keyvalueeditor('getValues');
                newParams = [];
                for (i = 0; i < params.length; i++) {
                    param = {
                        key:params[i].key,
                        value:params[i].value,
                        type:params[i].type
                    };

                    newParams.push(param);
                }

                if(asObjects === true) {
                    console.log(newParams);
                    return newParams;
                }
                else {
                    data = pm.request.getBodyParamString(newParams);    
                }
                
            }
            else if (mode === "raw") {
                data = pm.request.body.getRawData();
            }
            else if (mode === "urlencoded") {
                params = $('#urlencoded-keyvaleditor').keyvalueeditor('getValues');
                newParams = [];
                for (i = 0; i < params.length; i++) {
                    param = {
                        key:params[i].key,
                        value:params[i].value,
                        type:params[i].type
                    };

                    newParams.push(param);
                }

                if(asObjects === true) {
                    return newParams;
                }
                else {
                    data = pm.request.getBodyParamString(newParams);    
                }                
            }

            return data;
        },
        
        loadData:function (mode, data, asObjects) {
            var body = pm.request.body;
            body.setDataMode(mode);

            body.data = data;

            var params;
            if (mode === "params") {
                if(asObjects === true) {                    
                    $('#formdata-keyvaleditor').keyvalueeditor('reset', data);        
                }
                else {
                    params = getBodyVars(data, false);
                    $('#formdata-keyvaleditor').keyvalueeditor('reset', params);    
                }
                
            }
            else if (mode === "raw") {
                body.loadRawData(data);
            }
            else if (mode === "urlencoded") {
                if(asObjects === true) {
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', data);
                }
                else {
                    params = getBodyVars(data, false);
                    $('#urlencoded-keyvaleditor').keyvalueeditor('reset', params);    
                }
                
            }
        }
    },


    init:function () {
        this.url = "";
        this.urlParams = {};
        this.body.data = "";
        this.bodyParams = {};

        this.headers = [];

        this.method = "GET";
        this.dataMode = "params";

        if (!this.areListenersAdded) {
            this.areListenersAdded = true;
            this.initializeHeaderEditor();
            this.initializeUrlEditor();
            this.body.init();
            this.addListeners();
        }

        var lastRequest = pm.settings.get("lastRequest");
        if (lastRequest !== "") {
            var lastRequestParsed = JSON.parse(lastRequest);
            pm.request.isFromCollection = false;
            pm.request.loadRequestInEditor(lastRequestParsed);
        }
    },

    setHeaderValue:function (key, value) {
        var headers = pm.request.headers;
        var origKey = key;
        key = key.toLowerCase();
        var found = false;
        for (var i = 0, count = headers.length; i < count; i++) {
            var headerKey = headers[i].key.toLowerCase();

            if (headerKey === key && value !== "text") {
                headers[i].value = value;
                found = true;
            }
        }

        var editorId = "#headers-keyvaleditor";
        if (!found && value !== "text") {
            var header = {
                "key":origKey,
                "value":value
            };
            headers.push(header);
        }

        $(editorId).keyvalueeditor('reset', headers);
    },

    getHeaderValue:function (key) {
        var headers = pm.request.headers;
        key = key.toLowerCase();
        for (var i = 0, count = headers.length; i < count; i++) {
            var headerKey = headers[i].key.toLowerCase();

            if (headerKey === key) {
                return headers[i].value;
            }
        }

        return false;
    },

    getHeaderEditorParams:function () {
        var hs = $('#headers-keyvaleditor').keyvalueeditor('getValues');
        var newHeaders = [];
        for (var i = 0; i < hs.length; i++) {
            var header = {
                key:hs[i].key,
                value:hs[i].value,
                name:hs[i].key
            };

            newHeaders.push(header);
        }
        return newHeaders;
    },

    onHeaderAutoCompleteItemSelect:function(item) {        
        if(item.type == "preset") {
            var preset = pm.headerPresets.getHeaderPreset(item.id);
            if("headers" in preset) {                    
                var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
                var loc = -1;    
                for(var i = 0; i < headers.length; i++) {
                    if(headers[i].key === item.label) {
                        loc = i;
                        break;
                    }
                }          

                if(loc >= 0) {
                    headers.splice(loc, 1);        
                }                                            
                
                var newHeaders = _.union(headers, preset.headers);                
                $('#headers-keyvaleditor').keyvalueeditor('reset', newHeaders);

                //Ensures that the key gets focus
                var element = $('#headers-keyvaleditor .keyvalueeditor-last input:first-child')[0];
                $('#headers-keyvaleditor .keyvalueeditor-last input:first-child')[0].focus();
                setTimeout(function() {
                    element.focus();
                }, 10);                
            }
        }
    },

    initializeHeaderEditor:function () {
        var params = {
            placeHolderKey:"Header",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onInit:function () {
            },

            onAddedParam:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.presetsForAutoComplete,
                    delay:50,
                    select:function (event, item) {
                        pm.request.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onDeleteRow:function () {
                pm.request.headers = pm.request.getHeaderEditorParams();
                $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);
            },

            onFocusElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.presetsForAutoComplete,
                    delay:50,
                    select:function (event, item) {
                        pm.request.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onBlurElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.presetsForAutoComplete,
                    delay:50,
                    select:function (event, item) {
                        pm.request.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
                pm.request.headers = pm.request.getHeaderEditorParams();
                $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);
            },

            onReset:function () {
                var hs = $('#headers-keyvaleditor').keyvalueeditor('getValues');
                $('#headers-keyvaleditor-actions-open .headers-count').html(hs.length);
            }
        };

        $('#headers-keyvaleditor').keyvalueeditor('init', params);

        $('#headers-keyvaleditor-actions-close').on("click", function () {
            $('#headers-keyvaleditor-actions-open').removeClass("active");
            pm.request.closeHeaderEditor();
        });

        $('#headers-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#headers-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                pm.request.closeHeaderEditor();
            }
            else {
                pm.request.openHeaderEditor();
            }
        });
    },

    getAsJson:function () {
        var request = {
            url:$('#url').val(),
            data:pm.request.body.getData(true),
            headers:pm.request.getPackedHeaders(),
            dataMode:pm.request.dataMode,
            method:pm.request.method,
            version:2
        };

        console.log(request);

        return JSON.stringify(request);
    },

    saveCurrentRequestToLocalStorage:function () {
        pm.settings.set("lastRequest", pm.request.getAsJson());
    },

    openHeaderEditor:function () {
        $('#headers-keyvaleditor-actions-open').addClass("active");
        var containerId = "#headers-keyvaleditor-container";
        $(containerId).css("display", "block");
    },

    closeHeaderEditor:function () {
        $('#headers-keyvaleditor-actions-open').removeClass("active");
        var containerId = "#headers-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    getUrlEditorParams:function () {
        var editorId = "#url-keyvaleditor";
        var params = $(editorId).keyvalueeditor('getValues');
        var newParams = [];
        for (var i = 0; i < params.length; i++) {
            var param = {
                key:params[i].key,
                value:params[i].value
            };

            newParams.push(param);
        }

        return newParams;
    },

    initializeUrlEditor:function () {
        var editorId;
        editorId = "#url-keyvaleditor";

        var params = {
            placeHolderKey:"URL Parameter Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onDeleteRow:function () {
                pm.request.setUrlParamString(pm.request.getUrlEditorParams());
            },

            onBlurElement:function () {
                pm.request.setUrlParamString(pm.request.getUrlEditorParams());
            }
        };

        $(editorId).keyvalueeditor('init', params);

        $('#url-keyvaleditor-actions-close').on("click", function () {
            pm.request.closeUrlEditor();
        });

        $('#url-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#url-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                pm.request.closeUrlEditor();
            }
            else {
                var newRows = getUrlVars($('#url').val(), false);
                $(editorId).keyvalueeditor('reset', newRows);
                pm.request.openUrlEditor();
            }

        });
    },

    openUrlEditor:function () {
        $('#url-keyvaleditor-actions-open').addClass("active");
        var containerId = "#url-keyvaleditor-container";
        $(containerId).css("display", "block");
    },

    closeUrlEditor:function () {
        $('#url-keyvaleditor-actions-open').removeClass("active");
        var containerId = "#url-keyvaleditor-container";
        $(containerId).css("display", "none");
    },

    addListeners:function () {
        $('#data-mode-selector').on("click", "a", function () {
            var mode = $(this).attr("data-mode");
            pm.request.body.setDataMode(mode);
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

        $('#url').keyup(function () {
            var newRows = getUrlVars($('#url').val(), false);
            $('#url-keyvaleditor').keyvalueeditor('reset', newRows);
        });

        $('#add-to-collection').on("click", function () {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }
        });

        $("#submit-request").on("click", function () {
            pm.request.send("text");
        });

        $("#preview-request").on("click", function () {
            pm.request.preview();
        });

        $("#update-request-in-collection").on("click", function () {
            pm.collections.updateCollectionFromCurrentRequest();
        });

        $("#cancel-request").on("click", function () {
            pm.request.cancel();
        });

        $("#request-actions-reset").on("click", function () {
            pm.request.startNew();
        });

        $('#request-method-selector').change(function () {
            var val = $(this).val();
            pm.request.setMethod(val);
        });
    },

    getTotalTime:function () {
        this.totalTime = this.endTime - this.startTime;
        return this.totalTime;
    },

    response:{
        status:"",
        responseCode:[],
        time:0,
        headers:[],
        cookies:[],
        mime:"",
        text:"",

        state:{
            size:"normal"
        },
        previewType:"parsed",

        setMode:function (mode) {
            var text = pm.request.response.text;
            pm.request.response.setFormat(mode, text, pm.settings.get("previewType"), true);
        },

        stripScriptTag:function (text) {
            var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;            
            text = text.replace(re, "");            
            return text;
        },

        changePreviewType:function (newType) {
            if (this.previewType === newType) {
                return;
            }

            this.previewType = newType;
            $('#response-formatting a').removeClass('active');
            $('#response-formatting a[data-type="' + this.previewType + '"]').addClass('active');

            pm.settings.set("previewType", newType);

            if (newType === 'raw') {
                $('#response-as-text').css("display", "block");
                $('#response-as-code').css("display", "none");
                $('#response-as-preview').css("display", "none");
                $('#code-data-raw').val(this.text);
                var codeDataWidth = $(document).width() - $('#sidebar').width() - 60;
                $('#code-data-raw').css("width", codeDataWidth + "px");
                $('#code-data-raw').css("height", "600px");
                $('#response-pretty-modifiers').css("display", "none");
            }
            else if (newType === 'parsed') {
                $('#response-as-text').css("display", "none");
                $('#response-as-code').css("display", "block");
                $('#response-as-preview').css("display", "none");
                $('#code-data').css("display", "none");
                $('#response-pretty-modifiers').css("display", "block");
                pm.editor.codeMirror.refresh();
            }
            else if (newType === 'preview') {
                $('#response-as-text').css("display", "none");
                $('#response-as-code').css("display", "none");
                $('#code-data').css("display", "none");
                $('#response-as-preview').css("display", "block");
                $('#response-pretty-modifiers').css("display", "none");                
            }
        },

        loadHeaders:function (data) {
            this.headers = pm.request.unpackResponseHeaders(data);            

            if(pm.settings.get("usePostmanProxy") === true) {
                var count = this.headers.length;                
                for(var i = 0; i < count; i++) {
                    if(this.headers[i].key == "Postman-Location") {
                        this.headers[i].key = "Location";
                        this.headers[i].name = "Location";
                        break;
                    }                        
                }
            }

            $('#response-headers').html("");
            this.headers = _.sortBy(this.headers, function (header) {
                return header.name;
            });


            $("#response-headers").append(Handlebars.templates.response_headers({"items":this.headers}));
            $('.response-header-name').popover({
                trigger: "hover",
            });
        },

        clear:function () {
            this.startTime = 0;
            this.endTime = 0;
            this.totalTime = 0;
            this.status = "";
            this.time = 0;
            this.headers = {};
            this.mime = "";
            this.state.size = "normal";
            this.previewType = "parsed";
            $('#response').css("display", "none");
        },

        showScreen:function (screen) {
            $("#response").css("display", "block");
            var active_id = "#response-" + screen + "-container";
            var all_ids = ["#response-waiting-container",
                "#response-failed-container",
                "#response-success-container"];
            for (var i = 0; i < 3; i++) {
                $(all_ids[i]).css("display", "none");
            }

            $(active_id).css("display", "block");
        },

        render:function (response) {
            pm.request.response.showScreen("success");
            $('#response-status').html(Handlebars.templates.item_response_code(response.responseCode));
            $('.response-code').popover({
                trigger: "hover"
            });

            //This sets pm.request.response.headers
            $("#response-headers").append(Handlebars.templates.response_headers({"items":response.headers}));

            $('.response-tabs li[data-section="headers"]').html("Headers (" + response.headers.length + ")");
            $("#response-data").css("display", "block");

            $("#loader").css("display", "none");

            $('#response-time .data').html(response.time + " ms");

            var contentTypeIndexOf = find(response.headers, function (element, index, collection) {
                return element.key === "Content-Type";
            });

            var contentType;
            if (contentTypeIndexOf >= 0) {
                contentType = response.headers[contentTypeIndexOf].value;
            }

            $('#response').css("display", "block");
            $('#submit-request').button("reset");
            $('#code-data').css("display", "block");

            var language = 'html';

            pm.request.response.previewType = pm.settings.get("previewType");

            var responsePreviewType = 'html';

            if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
                if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
                    language = 'javascript';
                }

                $('#language').val(language);

                if (contentType.search(/image/i) >= 0) {
                    responsePreviewType = 'image';

                    $('#response-as-code').css("display", "none");
                    $('#response-as-text').css("display", "none");
                    $('#response-as-image').css("display", "block");
                    
                    var imgLink = pm.request.processUrl($('#url').val());

                    $('#response-formatting').css("display", "none");
                    $('#response-actions').css("display", "none");
                    $("#response-language").css("display", "none");
                    $("#response-as-preview").css("display", "none");
                    $("#response-pretty-modifiers").css("display", "none");
                    $("#response-as-image").html("<img src='" + imgLink + "'/>");
                }
                else {
                    responsePreviewType = 'html';
                    pm.request.response.setFormat(language, response.text, pm.settings.get("previewType"), true);
                }
            }
            else {
                pm.request.response.setFormat(language, response.text, pm.settings.get("previewType"), true);
            }

            pm.request.response.renderCookies(response.cookies);
            if (responsePreviewType === "html") {
                $("#response-as-preview").html("");
                
                var cleanResponseText = pm.request.response.stripScriptTag(pm.request.response.text);
                pm.filesystem.renderResponsePreview("response.html", cleanResponseText, "html", function (response_url) {
                    $("#response-as-preview").html("<iframe></iframe>");
                    $("#response-as-preview iframe").attr("src", response_url);
                });
            }

            if (pm.request.method === "HEAD") {
                pm.request.response.showHeaders()
            }

            if (pm.request.isFromCollection === true) {
                $("#response-collection-request-actions").css("display", "block");
            }
            else {
                $("#response-collection-request-actions").css("display", "none");
            }

            $("#response-sample-status").css("display", "block");

            var r = pm.request.response;
            r.time = response.time;
            r.cookies = response.cookies;
            r.headers = response.headers;
            r.text = response.text;
            r.responseCode = response.responseCode;

            $("#response-samples").css("display", "block");
        },

        load:function (response) {
            $("#response-sample-status").css("display", "none");
            if (response.readyState == 4) {
                //Something went wrong
                if (response.status == 0) {
                    var errorUrl = pm.envManager.convertString(pm.request.url);
                    $('#connection-error-url').html(errorUrl);
                    pm.request.response.showScreen("failed");
                    $('#submit-request').button("reset");
                    return false;
                }

                pm.request.response.showScreen("success")
                pm.request.response.showBody();

                var responseCodeName;
                if ("statusText" in response) {
                    responseCodeName = response.statusText;
                }
                else {
                    responseCodeName = httpStatusCodes[response.status]['name'];
                }

                var responseCode = {
                    'code':response.status,
                    'name':responseCodeName,
                    'detail':httpStatusCodes[response.status]['detail']
                };

                var responseData;
                if (response.responseType == "arraybuffer") {
                    responseData = response.response;
                }
                else {
                    this.text = response.responseText;
                }

                pm.request.endTime = new Date().getTime();

                var diff = pm.request.getTotalTime();

                pm.request.response.time = diff;
                pm.request.response.responseCode = responseCode;

                $('#response-status').html(Handlebars.templates.item_response_code(responseCode));
                $('.response-code').popover({
                    trigger: "hover"
                });

                //This sets pm.request.response.headers
                this.loadHeaders(response.getAllResponseHeaders());

                $('.response-tabs li[data-section="headers"]').html("Headers (" + this.headers.length + ")");
                $("#response-data").css("display", "block");

                $("#loader").css("display", "none");

                $('#response-time .data').html(diff + " ms");

                var contentType = response.getResponseHeader("Content-Type");

                $('#response').css("display", "block");
                $('#submit-request').button("reset");
                $('#code-data').css("display", "block");

                var language = 'html';

                pm.request.response.previewType = pm.settings.get("previewType");

                var responsePreviewType = 'html';

                if (!_.isUndefined(contentType) && !_.isNull(contentType)) {
                    if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
                        language = 'javascript';
                    }

                    $('#language').val(language);

                    if (contentType.search(/image/i) >= 0) {
                        responsePreviewType = 'image';

                        $('#response-as-code').css("display", "none");
                        $('#response-as-text').css("display", "none");
                        $('#response-as-image').css("display", "block");
                        var imgLink = pm.request.processUrl($('#url').val());

                        $('#response-formatting').css("display", "none");
                        $('#response-actions').css("display", "none");
                        $("#response-language").css("display", "none");
                        $("#response-as-preview").css("display", "none");
                        $("#response-pretty-modifiers").css("display", "none");
                        $("#response-as-image").html("<img src='" + imgLink + "'/>");
                    }
                    else if (contentType.search(/pdf/i) >= 0 && response.responseType == "arraybuffer") {
                        responsePreviewType = 'pdf';

                        // Hide everything else
                        $('#response-as-code').css("display", "none");
                        $('#response-as-text').css("display", "none");
                        $('#response-as-image').css("display", "none");
                        $('#response-formatting').css("display", "none");
                        $('#response-actions').css("display", "none");
                        $("#response-language").css("display", "none");

                        $("#response-as-preview").html("");
                        $("#response-as-preview").css("display", "block");
                        $("#response-pretty-modifiers").css("display", "none");
                        pm.filesystem.renderResponsePreview("response.pdf", responseData, "pdf", function (response_url) {
                            $("#response-as-preview").html("<iframe src='" + response_url + "'/>");
                        });

                    }
                    else if (contentType.search(/pdf/i) >= 0 && response.responseType == "text") {
                        pm.request.send("arraybuffer");
                        return;
                    }
                    else {
                        responsePreviewType = 'html';
                        this.setFormat(language, this.text, pm.settings.get("previewType"), true);
                    }
                }
                else {
                    this.setFormat(language, this.text, pm.settings.get("previewType"), true);
                }

                var url = pm.request.url;

                //Sets pm.request.response.cookies
                pm.request.response.loadCookies(url);

                if (responsePreviewType === "html") {
                    $("#response-as-preview").html("");                                    
                    var cleanResponseText = pm.request.response.stripScriptTag(pm.request.response.text);                    
                    pm.filesystem.renderResponsePreview("response.html", cleanResponseText, "html", function (response_url) {
                        $("#response-as-preview").html("<iframe></iframe>");
                        $("#response-as-preview iframe").attr("src", response_url);
                    });    
                }

                if (pm.request.method === "HEAD") {
                    pm.request.response.showHeaders()
                }

                if (pm.request.isFromCollection === true) {
                    $("#response-collection-request-actions").css("display", "block");
                }
                else {
                    $("#response-collection-request-actions").css("display", "none");
                }
            }

            pm.layout.setLayout();
            return true;
        },

        renderCookies:function (cookies) {
            var count = 0;
            if (!cookies) {
                count = 0;
            }
            else {
                count = cookies.length;
            }

            if (count === 0) {
                $("#response-tabs-cookies").html("Cookies");
                $('#response-tabs-cookies').css("display", "none");
            }
            else {
                $("#response-tabs-cookies").html("Cookies (" + count + ")");
                $('#response-tabs-cookies').css("display", "block");
                cookies = _.sortBy(cookies, function (cookie) {
                    return cookie.name;
                });

                for (var i = 0; i < count; i++) {
                    var cookie = cookies[i];
                    if ("expirationDate" in cookie) {
                        var date = new Date(cookie.expirationDate * 1000);
                        cookies[i].expires = date.toUTCString();
                    }
                }

                $('#response-cookies-items').html(Handlebars.templates.response_cookies({"items":cookies}));
            }

            pm.request.response.cookies = cookies;
        },

        loadCookies:function (url) {
            chrome.cookies.getAll({url:url}, function (cookies) {
                var count;
                pm.request.response.renderCookies(cookies);
            });
        },

        setFormat:function (language, response, format, forceCreate) {
            //Keep CodeMirror div visible otherwise the response gets cut off
            $('#response-as-code').css("display", "block");
            $('#response-as-text').css("display", "none");

            $('#response-as-image').css("display", "none");
            $('#response-formatting').css("display", "block");
            $('#response-actions').css("display", "block");

            $('#response-formatting a').removeClass('active');
            $('#response-formatting a[data-type="' + format + '"]').addClass('active');
            $('#code-data').css("display", "none");
            $('#code-data').attr("data-mime", language);

            var codeDataArea = document.getElementById("code-data");
            var foldFunc;
            var mode;

            $('#response-language').css("display", "block");
            $('#response-language a').removeClass("active");
            //Use prettyprint here instead of stringify
            if (language === 'javascript') {
                try {
                    response = vkbeautify.json(response);
                    mode = 'javascript';
                    foldFunc = CodeMirror.newFoldFunction(CodeMirror.braceRangeFinder);
                }
                catch (e) {
                    mode = 'text';
                }
                $('#response-language a[data-mode="javascript"]').addClass("active");

            }
            else if (language === 'html') {
                response = vkbeautify.xml(response);
                mode = 'xml';
                foldFunc = CodeMirror.newFoldFunction(CodeMirror.tagRangeFinder);
                $('#response-language a[data-mode="html"]').addClass("active");
            }
            else {
                mode = 'text';
            }

            var lineWrapping;
            if (pm.settings.get("lineWrapping") === true) {
                $('#response-body-line-wrapping').addClass("active");
                lineWrapping = true;
            }
            else {
                $('#response-body-line-wrapping').removeClass("active");
                lineWrapping = false;
            }

            pm.editor.mode = mode;
            var renderMode = mode;
            if ($.inArray(mode, ["javascript", "xml", "html"]) >= 0) {
                renderMode = "links";
            }

            if (!pm.editor.codeMirror || forceCreate) {
                $('#response .CodeMirror').remove();
                pm.editor.codeMirror = CodeMirror.fromTextArea(codeDataArea,
                    {
                        mode:renderMode,
                        lineNumbers:true,
                        fixedGutter:true,
                        onGutterClick:foldFunc,
                        theme:'eclipse',
                        lineWrapping:lineWrapping,
                        readOnly:true
                    });

                var cm = pm.editor.codeMirror;
                cm.setValue(response);
            }
            else {
                pm.editor.codeMirror.setOption("onGutterClick", foldFunc);
                pm.editor.codeMirror.setOption("mode", renderMode);
                pm.editor.codeMirror.setOption("lineWrapping", lineWrapping);
                pm.editor.codeMirror.setOption("theme", "eclipse");
                pm.editor.codeMirror.setOption("readOnly", false);
                pm.editor.codeMirror.setValue(response);
                pm.editor.codeMirror.refresh();
                CodeMirror.commands["goDocStart"](pm.editor.codeMirror);
                $(window).scrollTop(0);
            }

            //If the format is raw then switch
            if (format === "parsed") {
                $('#response-as-code').css("display", "block");
                $('#response-as-text').css("display", "none");
                $('#response-as-preview').css("display", "none");
                $('#response-pretty-modifiers').css("display", "block");
            }
            else if (format === "raw") {
                $('#code-data-raw').val(response);
                var codeDataWidth = $(document).width() - $('#sidebar').width() - 60;
                $('#code-data-raw').css("width", codeDataWidth + "px");
                $('#code-data-raw').css("height", "600px");
                $('#response-as-code').css("display", "none");
                $('#response-as-text').css("display", "block");
                $('#response-pretty-modifiers').css("display", "none");
            }
            else if (format === "preview") {
                $('#response-as-code').css("display", "none");
                $('#response-as-text').css("display", "none");
                $('#response-as-preview').css("display", "block");
                $('#response-pretty-modifiers').css("display", "none");
            }


        },

        toggleBodySize:function () {
            if ($('#response').css("display") === "none") {
                return false;
            }

            $('a[rel="tooltip"]').tooltip('hide');
            if (this.state.size === "normal") {
                this.state.size = "maximized";
                $('#response-body-toggle img').attr("src", "img/full-screen-exit-alt-2.png");
                this.state.width = $('#response-data').width();
                this.state.height = $('#response-data').height();
                this.state.display = $('#response-data').css("display");
                this.state.position = $('#response-data').css("position");

                $('#response-data').css("position", "absolute");
                $('#response-data').css("left", 0);
                $('#response-data').css("top", "-15px");
                $('#response-data').css("width", $(document).width() - 20);
                $('#response-data').css("height", $(document).height());
                $('#response-data').css("z-index", 100);
                $('#response-data').css("background-color", "#fff");
                $('#response-data').css("padding", "10px");
            }
            else {
                this.state.size = "normal";
                $('#response-body-toggle img').attr("src", "img/full-screen-alt-4.png");
                $('#response-data').css("position", this.state.position);
                $('#response-data').css("left", 0);
                $('#response-data').css("top", 0);
                $('#response-data').css("width", this.state.width);
                $('#response-data').css("height", this.state.height);
                $('#response-data').css("z-index", 10);
                $('#response-data').css("background-color", "#fff");
                $('#response-data').css("padding", "0px");
            }
        },

        showHeaders:function () {
            $('.response-tabs li').removeClass("active");
            $('.response-tabs li[data-section="headers"]').addClass("active");
            $('#response-data-container').css("display", "none");
            $('#response-headers-container').css("display", "block");
            $('#response-cookies-container').css("display", "none");
        },

        showBody:function () {
            $('.response-tabs li').removeClass("active");
            $('.response-tabs li[data-section="body"]').addClass("active");
            $('#response-data-container').css("display", "block");
            $('#response-headers-container').css("display", "none");
            $('#response-cookies-container').css("display", "none");
        },

        showCookies:function () {
            $('.response-tabs li').removeClass("active");
            $('.response-tabs li[data-section="cookies"]').addClass("active");
            $('#response-data-container').css("display", "none");
            $('#response-headers-container').css("display", "none");
            $('#response-cookies-container').css("display", "block");
        },

        openInNewWindow:function (data) {
            var name = "response.html";
            var type = "text/html";
            pm.filesystem.saveAndOpenFile(name, data, type, function () {
            });
        }
    },

    startNew:function () {
        if (pm.request.xhr !== null) {
            pm.request.xhr.abort();
        }

        this.url = "";
        this.urlParams = {};
        this.body.data = "";
        this.bodyParams = {};
        this.name = "";
        this.description = "";
        this.headers = [];

        this.method = "GET";
        this.dataMode = "params";

        this.refreshLayout();
        $('#url-keyvaleditor').keyvalueeditor('reset');
        $('#headers-keyvaleditor').keyvalueeditor('reset');
        $('#formdata-keyvaleditor').keyvalueeditor('reset');
        $('#update-request-in-collection').css("display", "none");
        $('#url').val();
        $('#url').focus();
        this.response.clear();
    },

    cancel:function () {
        if (pm.request.xhr !== null) {
            pm.request.xhr.abort();
        }

        pm.request.response.clear();
    },

    setMethod:function (method) {
        this.url = $('#url').val();
        this.method = method;
        this.refreshLayout();
    },

    refreshLayout:function () {
        $('#url').val(this.url);
        $('#request-method-selector').val(this.method);
        pm.request.body.loadRawData(pm.request.body.getData());
        $('#headers-keyvaleditor').keyvalueeditor('reset', this.headers);
        $('#headers-keyvaleditor-actions-open .headers-count').html(this.headers.length);
        $('#submit-request').button("reset");
        $('#data-mode-selector a').removeClass("active");
        $('#data-mode-selector a[data-mode="' + this.dataMode + '"]').addClass("active");

        if (this.isMethodWithBody(this.method)) {
            $("#data").css("display", "block");
            var mode = this.dataMode;
            pm.request.body.setDataMode(mode);
        } else {
            pm.request.body.hide();
        }

        if (this.name !== "") {
            $('#request-meta').css("display", "block");
            $('#request-name').css("display", "inline-block");
            if ($('#request-description').css("display") === "block") {
                $('#request-description').css("display", "block");
            }
            else {
                $('#request-description').css("display", "none");
            }
        }
        else {
            $('#request-meta').css("display", "none");
            $('#request-name').css("display", "none");
            $('#request-description').css("display", "none");
            $('#request-samples').css("display", "none");
        }

        $('.request-help-actions-togglesize a').attr('data-action', 'minimize');
        $('.request-help-actions-togglesize img').attr('src', 'img/circle_minus.png');
    },

    loadRequestFromLink:function (link, headers) {
        this.startNew();
        this.url = link;
        this.method = "GET";

        pm.request.isFromCollection = false;
        if (pm.settings.get("retainLinkHeaders") === true) {
            if (headers) {
                pm.request.headers = headers;
            }
        }

        this.refreshLayout();
    },

    isMethodWithBody:function (method) {
        method = method.toUpperCase();
        return $.inArray(method, pm.request.methodsWithBody) >= 0;
    },

    packHeaders:function (headers) {
        var headersLength = headers.length;
        var paramString = "";
        for (var i = 0; i < headersLength; i++) {
            var h = headers[i];
            if (h.name && h.name !== "") {
                paramString += h.name + ": " + h.value + "\n";
            }
        }

        return paramString;
    },

    getPackedHeaders:function () {
        return this.packHeaders(this.headers);
    },

    unpackResponseHeaders:function (data) {
        if (data === null || data === "") {
            return [];
        }
        else {
            var vars = [], hash;
            var hashes = data.split('\n');
            var header;

            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i];
                var loc = hash.search(':');

                if (loc !== -1) {
                    var name = $.trim(hash.substr(0, loc));
                    var value = $.trim(hash.substr(loc + 1));

                    header = {
                        "name":name,
                        "key":name,
                        "value":value,
                        "description":headerDetails[name.toLowerCase()]
                    };

                    vars.push(header);
                }
            }

            return vars;
        }
    },

    unpackHeaders:function (data) {
        if (data === null || data === "") {
            return [];
        }
        else {
            var vars = [], hash;
            var hashes = data.split('\n');
            var header;

            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i];
                if (!hash) {
                    continue;
                }

                var loc = hash.search(':');

                if (loc !== -1) {
                    var name = $.trim(hash.substr(0, loc));
                    var value = $.trim(hash.substr(loc + 1));
                    header = {
                        "name":$.trim(name),
                        "key":$.trim(name),
                        "value":$.trim(value),
                        "description":headerDetails[$.trim(name).toLowerCase()]
                    };

                    vars.push(header);
                }
            }

            return vars;
        }
    },

    loadRequestInEditor:function (request, isFromCollection, isFromSample) {        
        console.log(request);

        pm.helpers.showRequestHelper("normal");
        this.url = request.url;
        this.body.data = request.body;
        this.method = request.method.toUpperCase();

        if (isFromCollection) {
            $('#update-request-in-collection').css("display", "inline-block");

            if (typeof request.name !== "undefined") {
                this.name = request.name;
                $('#request-meta').css("display", "block");
                $('#request-name').html(this.name);
                $('#request-name').css("display", "inline-block");
            }
            else {
                this.name = "";
                $('#request-meta').css("display", "none");
                $('#request-name').css("display", "none");
            }

            if (typeof request.description !== "undefined") {
                this.description = request.description;
                $('#request-description').html(this.description);
                $('#request-description').css("display", "block");
            }
            else {
                this.description = "";
                $('#request-description').css("display", "none");
            }

            $('#response-sample-save-form').css("display", "none");

            //Disabling this. Will enable after resolving indexedDB issues
            //$('#response-sample-save-start-container').css("display", "inline-block");

            $('.request-meta-actions-togglesize').attr('data-action', 'minimize');
            $('.request-meta-actions-togglesize img').attr('src', 'img/circle_minus.png');

            //Load sample
            if ("responses" in request) {
                pm.request.responses = request.responses;
                $("#request-samples").css("display", "block");
                if (request.responses) {
                    if (request.responses.length > 0) {
                        $('#request-samples table').html("");
                        $('#request-samples table').append(Handlebars.templates.sample_responses({"items":request.responses}));
                    }
                    else {
                        $('#request-samples table').html("");
                        $("#request-samples").css("display", "none");
                    }
                }
                else {
                    pm.request.responses = [];
                    $('#request-samples table').html("");
                    $("#request-samples").css("display", "none");
                }

            }
            else {
                pm.request.responses = [];
                $('#request-samples table').html("");
                $("#request-samples").css("display", "none");
            }
        }
        else if (isFromSample) {
            $('#update-request-in-collection').css("display", "inline-block");
        }
        else {
            this.name = "";
            $('#request-meta').css("display", "none");
            $('#update-request-in-collection').css("display", "none");
        }

        if (typeof request.headers !== "undefined") {
            this.headers = this.unpackHeaders(request.headers);
        }
        else {
            this.headers = [];
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(this.headers.length);

        $('#url').val(this.url);

        var newUrlParams = getUrlVars(this.url, false);

        //@todoSet params using keyvalueeditor function
        $('#url-keyvaleditor').keyvalueeditor('reset', newUrlParams);
        $('#headers-keyvaleditor').keyvalueeditor('reset', this.headers);

        this.response.clear();

        $('#request-method-selector').val(this.method);

        if (this.isMethodWithBody(this.method)) {
            this.dataMode = request.dataMode;
            $('#data').css("display", "block");

            if("version" in request) {
                if(request.version == 2) {
                    pm.request.body.loadData(request.dataMode, request.data, true);        
                }
                else {
                    pm.request.body.loadData(request.dataMode, request.data);        
                }
            }
            else {
                pm.request.body.loadData(request.dataMode, request.data);    
            }
            
        }
        else {
            $('#data').css("display", "none");
        }

        //Set raw body editor value if Content-Type is present
        var contentType = pm.request.getHeaderValue("Content-Type");
        var mode;
        var language;
        if (contentType === false) {
            mode = 'text';
            language = 'text';
        }
        else if (contentType.search(/json/i) !== -1 || contentType.search(/javascript/i) !== -1) {
            mode = 'javascript';
            language = 'json';
        }
        else if (contentType.search(/xml/i) !== -1) {
            mode = 'xml';
            language = 'xml';
        }
        else if (contentType.search(/html/i) !== -1) {
            mode = 'xml';
            language = 'html';
        }
        else {
            language = 'text';
            contentType = 'text';
        }

        pm.request.body.setEditorMode(mode, language);
        $('body').scrollTop(0);
    },

    getBodyParamString:function (params) {
        var paramsLength = params.length;
        var paramArr = [];
        for (var i = 0; i < paramsLength; i++) {
            var p = params[i];
            if (p.key && p.key !== "") {
                paramArr.push(p.key + "=" + p.value);
            }
        }
        return paramArr.join('&');
    },

    setUrlParamString:function (params) {
        this.url = $('#url').val();
        var url = this.url;

        var paramArr = [];

        for (var i = 0; i < params.length; i++) {
            var p = params[i];
            if (p.key && p.key !== "") {
                paramArr.push(p.key + "=" + p.value);
            }
        }

        var baseUrl = url.split("?")[0];
        if (paramArr.length > 0) {
            $('#url').val(baseUrl + "?" + paramArr.join('&'));
        }
        else {
            //Has key/val pair
            if (url.indexOf("?") > 0 && url.indexOf("=") > 0) {
                $('#url').val(baseUrl);
            }
            else {
                $('#url').val(url);
            }

        }
    },

    reset:function () {
    },

    encodeUrl:function (url) {
        var quesLocation = url.indexOf('?');

        if (quesLocation > 0) {
            var urlVars = getUrlVars(url);
            var baseUrl = url.substring(0, quesLocation);
            var urlVarsCount = urlVars.length;
            var newUrl = baseUrl + "?";
            for (var i = 0; i < urlVarsCount; i++) {
                newUrl += encodeURIComponent(urlVars[i].key) + "=" + encodeURIComponent(urlVars[i].value) + "&";
            }

            newUrl = newUrl.substr(0, newUrl.length - 1);
            return url;
        }
        else {
            return url;
        }
    },

    prepareHeadersForProxy:function (headers) {
        var count = headers.length;
        for (var i = 0; i < count; i++) {
            var key = headers[i].key.toLowerCase();
            if (_.indexOf(pm.bannedHeaders, key) >= 0) {
                headers[i].key = "Postman-" + headers[i].key;
                headers[i].name = "Postman-" + headers[i].name;
            }
        }

        return headers;
    },

    processUrl:function (url) {
        var envManager = pm.envManager;
        var environment = envManager.selectedEnv;
        var envValues = [];
        var url = $('#url').val();
        
        if (environment !== null) {
            envValues = environment.values;
        }

        url = envManager.processString(url, envValues);
        url = ensureProperUrl(url);

        return url;
    },

    //Send the current request
    send:function (responseType) {
        // Set state as if change event of input handlers was called
        pm.request.setUrlParamString(pm.request.getUrlEditorParams());
        pm.request.headers = pm.request.getHeaderEditorParams();

        if (pm.helpers.activeHelper == "oauth1" && pm.helpers.oAuth1.isAutoEnabled) {            
            pm.helpers.oAuth1.generateHelper();
            pm.helpers.oAuth1.process();
        }

        $('#headers-keyvaleditor-actions-open .headers-count').html(pm.request.headers.length);

        var i;
        this.url = pm.request.processUrl($('#url').val());
        var envManager = pm.envManager;         
        var environment = envManager.selectedEnv;
        var envValues = [];
        var url = $('#url').val();
        
        if (environment !== null) {
            envValues = environment.values;
        }

        var url = this.url;
        this.body.data = pm.request.body.getData(true);

        if (url === "") {
            return;
        }

        var xhr = new XMLHttpRequest();
        pm.request.xhr = xhr;
        pm.request.url = url;

        url = pm.request.encodeUrl(url);

        var originalUrl = $('#url').val();
        var method = this.method.toUpperCase();

        var data = pm.request.body.getData(true);
        var originalData = data;

        console.log(originalData);

        var finalBodyData;
        var headers = this.headers;

        if (pm.settings.get("usePostmanProxy") == true) {
            headers = pm.request.prepareHeadersForProxy(headers);
        }

        pm.request.startTime = new Date().getTime();

        xhr.onreadystatechange = function (event) {
            pm.request.response.load(event.target);
        };

        if (!responseType) {
            responseType = "text";
        }

        xhr.responseType = responseType;
        xhr.open(method, url, true);

        for (i = 0; i < headers.length; i++) {
            var header = headers[i];
            if (!_.isEmpty(header.value)) {
                xhr.setRequestHeader(header.name, envManager.processString(header.value, envValues));
            }
        }

        if(pm.settings.get("sendNoCacheHeader") === true) {
            xhr.setRequestHeader("Cache-Control", "no-cache");                
        }

        var rows, count, j;
        var row, key, value;

        // Prepare body
        if (this.isMethodWithBody(method)) {
            if (this.dataMode === 'raw') {
                data = envManager.processString(data, envValues);
                finalBodyData = data;
                xhr.send(finalBodyData);
            }
            else if (this.dataMode === 'params') {
                finalBodyData = new FormData();

                rows = $('#formdata-keyvaleditor').keyvalueeditor('getElements');

                count = rows.length;

                for (j = 0; j < count; j++) {
                    row = rows[j];
                    key = row.keyElement.val();
                    var valueType = row.valueType;
                    var valueElement = row.valueElement;

                    if (valueType === "file") {
                        var domEl = valueElement.get(0);
                        var len = domEl.files.length;
                        for (i = 0; i < len; i++) {
                            finalBodyData.append(key, domEl.files[i]);
                        }
                    }
                    else {
                        value = valueElement.val();
                        value = envManager.processString(value, envValues);
                        finalBodyData.append(key, value);
                    }
                }

                if (count > 0) {
                    xhr.send(finalBodyData);
                }
                else {
                    xhr.send();
                }
            }
            else if (this.dataMode === 'urlencoded') {
                finalBodyData = "";
                rows = $('#urlencoded-keyvaleditor').keyvalueeditor('getElements');
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                count = rows.length;
                for (j = 0; j < count; j++) {
                    row = rows[j];
                    value = row.valueElement.val();
                    value = envManager.processString(value, envValues);
                    value = encodeURIComponent(value);                    
                    value = value.replace(/%20/g, '+');
                    key = encodeURIComponent(row.keyElement.val());
                    key = key.replace(/%20/g, '+');
                    
                    finalBodyData += key + "=" + value + "&";
                }

                finalBodyData = finalBodyData.substr(0, finalBodyData.length - 1);

                if (count > 0) {
                    xhr.send(finalBodyData);
                }
                else {
                    xhr.send();
                }
            }
        } else {
            xhr.send();
        }

        if (pm.settings.get("autoSaveRequest")) {
            pm.history.addRequest(originalUrl, method, pm.request.getPackedHeaders(), originalData, this.dataMode);
        }

        $('#submit-request').button("loading");
        pm.request.response.clear();
        pm.request.response.showScreen("waiting");
    },

    preview:function() {
        console.log("Preview this request");
        if(pm.request.editorMode == 1) {
            pm.request.editorMode = 0;    
            $("#request-builder").css("display", "block");
            $("#request-preview").css("display", "none");    
        }
        else {
            pm.request.editorMode = 1;    
            $("#request-builder").css("display", "none");
            $("#request-preview").css("display", "block");    
        }               
    }

};
pm.settings = {
    historyCount:50,
    lastRequest:"",
    autoSaveRequest:true,
    selectedEnvironmentId:"",

    init:function () {
        pm.settings.create("historyCount", 100);
        pm.settings.create("autoSaveRequest", true);
        pm.settings.create("selectedEnvironmentId", true);
        pm.settings.create("lineWrapping", true);
        pm.settings.create("previewType", "parsed");
        pm.settings.create("retainLinkHeaders", false);
        pm.settings.create("sendNoCacheHeader", true);
        pm.settings.create("usePostmanProxy", false);        
        pm.settings.create("proxyURL", "");
        pm.settings.create("lastRequest", "");
        pm.settings.create("launcherNotificationCount", 0);
        pm.settings.create("variableDelimiter", "{{...}}");

        $('#history-count').val(pm.settings.get("historyCount"));
        $('#auto-save-request').val(pm.settings.get("autoSaveRequest") + "");
        $('#retain-link-headers').val(pm.settings.get("retainLinkHeaders") + "");
        $('#send-no-cache-header').val(pm.settings.get("sendNoCacheHeader") + "");
        $('#use-postman-proxy').val(pm.settings.get("usePostmanProxy") + "");
        $('#postman-proxy-url').val(pm.settings.get("postmanProxyUrl"));
        $('#variable-delimiter').val(pm.settings.get("variableDelimiter"));

        $('#history-count').change(function () {
            pm.settings.set("historyCount", $('#history-count').val());
        });

        $('#auto-save-request').change(function () {
            var val = $('#auto-save-request').val();
            if (val == "true") {
                pm.settings.set("autoSaveRequest", true);
            }
            else {
                pm.settings.set("autoSaveRequest", false);
            }
        });

        $('#retain-link-headers').change(function () {
            var val = $('#retain-link-headers').val();
            if (val === "true") {
                pm.settings.set("retainLinkHeaders", true);
            }
            else {
                pm.settings.set("retainLinkHeaders", false);
            }
        });        

        $('#send-no-cache-header').change(function () {
            var val = $('#send-no-cache-header').val();
            if (val == "true") {
                pm.settings.set("sendNoCacheHeader", true);
            }
            else {
                pm.settings.set("sendNoCacheHeader", false);
            }
        });

        $('#use-postman-proxy').change(function () {
            var val = $('#use-postman-proxy').val();
            if (val == "true") {
                pm.settings.set("usePostmanProxy", true);
                $('#postman-proxy-url-container').css("display", "block");
            }
            else {
                pm.settings.set("usePostmanProxy", false);
                $('#postman-proxy-url-container').css("display", "none");
            }
        });

        $('#postman-proxy-url').change(function () {
            pm.settings.set("postmanProxyUrl", $('#postman-proxy-url').val());
        });

        $('#variable-delimiter').change(function () {
            pm.settings.set("variableDelimiter", $('#variable-delimiter').val());
        });

        if (pm.settings.get("usePostmanProxy") == true) {
            $('#postman-proxy-url-container').css("display", "block");
        }
        else {
            $('#postman-proxy-url-container').css("display", "none");
        }
    },

    create:function (key, defaultVal) {
        if (localStorage[key]) {
            pm.settings[key] = localStorage[key];
        }
        else {
            if (defaultVal !== "undefined") {
                pm.settings[key] = defaultVal;
                localStorage[key] = defaultVal;
            }
        }
    },

    set:function (key, value) {
        console.log(key, value);
        pm.settings[key] = value;
        localStorage[key] = value;
    },

    get:function (key) {
        var val = localStorage[key];
        if (val === "true") {
            return true;
        }
        else if (val === "false") {
            return false;
        }
        else {
            return localStorage[key];
        }
    }
};
pm.urlCache = {
    urls:[],
    addUrl:function (url) {
        if ($.inArray(url, this.urls) == -1) {
            pm.urlCache.urls.push(url);
            this.refreshAutoComplete();
        }
    },

    refreshAutoComplete:function () {
        $("#url").autocomplete({
            source:pm.urlCache.urls,
            delay:50
        });
    }
};