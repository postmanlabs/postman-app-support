var HeaderPresetsModal = Backbone.View.extend({
    el: $("#modal-header-presets"),

    initialize: function() {
        this.model.on('add', this.render, this);
        this.model.on('remove', this.render, this);
        this.model.on('change', this.render, this);

        var headerPresets = this.model;
        var view = this;

        $("#modal-header-presets").on("shown", function () {
            $(".header-presets-actions-add").focus();
            pm.app.trigger("modalOpen", "#modal-header-presets");
        });

        $("#modal-header-presets").on("hidden", function () {
            pm.app.trigger("modalClose");
        });

        $(".header-presets-actions-add").on("click", function () {
            view.showEditor();
        });

        $(".header-presets-actions-back").on("click", function () {
            view.showList();
        });

        $(".header-presets-actions-submit").on("click", function () {
            var id = $('#header-presets-editor-id').val();
            var name = $("#header-presets-editor-name").val();
            var headers = $("#header-presets-keyvaleditor").keyvalueeditor("getValues");

            // TODO Hacky
            if (id === "0") {
                _.bind(headerPresets.addHeaderPreset, headerPresets)(name, headers);
            }
            else {
                _.bind(headerPresets.editHeaderPreset, headerPresets)(id, name, headers);
            }

            view.showList();
        });

        $("#header-presets-list").on("click", ".header-preset-action-edit", function (event) {
            var id = $(event.currentTarget).attr("data-id");
            var preset = _.bind(headerPresets.getHeaderPreset, headerPresets)(id);
            $('#header-presets-editor-name').val(preset.get("name"));
            $('#header-presets-editor-id').val(preset.get("id"));
            $('#header-presets-keyvaleditor').keyvalueeditor('reset', preset.get("headers"));
            view.showEditor();
        });

        $("#header-presets-list").on("click", ".header-preset-action-delete", function (event) {
            var id = $(event.currentTarget).attr("data-id");
            headerPresets.deleteHeaderPreset(id);
        });
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

    render: function() {
        $('#header-presets-list tbody').html("");
        $('#header-presets-list tbody').append(Handlebars.templates.header_preset_list({"items":this.model.toJSON()}));
    }
});