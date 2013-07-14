var RequestMethodEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;
        $('#request-method-selector').change(function () {
            var val = $(this).val();
            _.bind(view.setMethod, view)(val);
        });
    },

    setMethod:function (method) {
        this.model.set("url", $('#url').val());
        this.model.set("method", method);

        //TODO Why do we need this?
        //TODO Caution! Changed from previous logic
        if (this.model.isMethodWithBody(method)) {
            this.model.set("dataMode", "params");
        }
        else {
            this.model.set("dataMode", "");
        }
    }
})