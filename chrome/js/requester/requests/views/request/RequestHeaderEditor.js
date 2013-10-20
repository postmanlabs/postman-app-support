var RequestHeaderEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;
        model.on("change:headers", this.onChangeHeaders, this);
        model.on("customHeaderUpdate", this.onCustomHeaderUpdate, this);

        var contentTypes = [
            "application/json"
        ];

        var params = {
            placeHolderKey:"Header",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">',
            onInit:function () {
            },

            onAddedParam:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.getPresetsForAutoComplete(),
                    delay:50,
                    select:function (event, item) {
                        view.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });
            },

            onDeleteRow:function () {
                var headers = view.getHeaderEditorParams();
                $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
                model.set(headers, { silent: true });
            },

            onFocusElement:function (event) {
                view.currentFocusedRow = $(event.currentTarget).parent()[0];

                var thisInputIsAValue = $(event.currentTarget).attr("class").search("keyvalueeditor-value") >= 0;

                if(thisInputIsAValue) {
                    var parent = view.currentFocusedRow;
                    var keyInput = $(parent).children(".keyvalueeditor-key")[0];
                    var keyValue = $(keyInput).val().toLowerCase();
                    if (keyValue === "content-type") {
                        $(event.currentTarget).autocomplete({
                            source: mediatypes,
                            delay: 50
                        });
                    }
                }

                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.getPresetsForAutoComplete(),
                    delay:50,
                    select:function (event, item) {
                        console.log("Cat complete is on", event, item);
                        _.bind(view.onHeaderAutoCompleteItemSelect, view)(item.item);
                    }
                });
            },

            onBlurElement:function () {
                $("#headers-keyvaleditor .keyvalueeditor-key").catcomplete({
                    source:pm.headerPresets.getPresetsForAutoComplete(),
                    delay:50,
                    select:function (event, item) {
                        console.log("Cat complete is on", event, item);
                        view.onHeaderAutoCompleteItemSelect(item.item);
                    }
                });

                var headers = view.getHeaderEditorParams();
                $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
                model.set(headers, { silent: true });
            },

            onReset:function () {
                var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
                $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
                model.set(headers, { silent: true });
            }
        };

        $('#headers-keyvaleditor').keyvalueeditor('init', params);

        $('#headers-keyvaleditor-actions-close').on("click", function () {
            $('#headers-keyvaleditor-actions-open').removeClass("active");
            view.closeHeaderEditor();
        });

        $('#headers-keyvaleditor-actions-open').on("click", function () {
            var isDisplayed = $('#headers-keyvaleditor-container').css("display") === "block";
            if (isDisplayed) {
                view.closeHeaderEditor();
            }
            else {
                view.openHeaderEditor();
            }
        });


        $(document).bind('keydown', 'h', function () {
            if(pm.app.isModalOpen()) {
                return;
            }

            var display = $("#headers-keyvaleditor-container").css("display");

            if (display === "block") {
                view.closeHeaderEditor();
            }
            else {
                view.openHeaderEditor();
                $('#headers-keyvaleditor div:first-child input:first-child').focus();
            }

            return false;
        });
    },

    onCustomHeaderUpdate: function() {
        this.openHeaderEditor();
    },

    onChangeHeaders: function() {
        var headers = this.model.get("headers");
        console.log("Headers changed", headers);
        $('#headers-keyvaleditor').keyvalueeditor('reset', headers);
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

    setHeaderValue:function (key, value) {
        var headers = this.model.get("headers");
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

    updateModel: function() {
        this.model.set("headers", this.getHeaderEditorParams(), {silent: true});
        var headers = this.model.get("headers");
        $('#headers-keyvaleditor-actions-open .headers-count').html(headers.length);
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
        if(item.type === "preset") {
            $(this.currentFocusedRow).remove();

            var preset = pm.headerPresets.getHeaderPreset(item.id);

            var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
            var newHeaders = _.union(headers, preset.get("headers"));
            $('#headers-keyvaleditor').keyvalueeditor('reset', newHeaders);

            //Ensures that the key gets focus
            var element = $('#headers-keyvaleditor .keyvalueeditor-last input:first-child')[0];
            $('#headers-keyvaleditor .keyvalueeditor-last input:first-child')[0].focus();
            setTimeout(function() {
                element.focus();
            }, 10);

        }
    }
});