var HeaderPresetsRequestEditor = Backbone.View.extend({
    initialize: function() {
        this.model.on('change:presets', this.render, this);

        var model = this.model;

        var params = {
            placeHolderKey:"Key",
            placeHolderValue:"Value",
            deleteButton:'<img class="deleteButton" src="img/delete.png">'
        };

        $("#header-presets-keyvaleditor").keyvalueeditor("init", params);

        $("#headers-keyvaleditor-actions-manage-presets").on("click", function () {
            $("#modal-header-presets").modal("show");
        });

        $("#headers-keyvaleditor-actions-add-preset").on("click", ".header-preset-dropdown-item", function() {
            var id = $(this).attr("data-id");
            var preset = model.getHeaderPreset(id);

            if("headers" in preset) {
                var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');

                var newHeaders = _.union(headers, preset.headers);
                $('#headers-keyvaleditor').keyvalueeditor('reset', newHeaders);
            }
        });
    },

    render: function() {
        $('#headers-keyvaleditor-actions-add-preset ul').html("");
        $('#headers-keyvaleditor-actions-add-preset ul').append(Handlebars.templates.header_preset_dropdown({"items":this.model.get("presets")}));
    }
});