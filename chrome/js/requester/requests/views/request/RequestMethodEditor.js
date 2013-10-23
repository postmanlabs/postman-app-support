var RequestMethodEditor = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var view = this;

        // TODO Set select values using RequestMethods
        console.log("Initialized request methods editor");

        model.on("startNew", this.onStartNew, this);

        $('#request-method-selector').change(function () {
            var val = $(this).val();
            _.bind(view.setMethod, view)(val);
        });
    },

    onStartNew: function() {
        $('#request-method-selector').val("GET");
    },

    setMethod:function (method) {
        var body = this.model.get("body");

        this.model.set("url", $('#url').val());
        this.model.set("method", method);

        // Change only for methods not with body to make sure
        // current body type is not switched
        if (!this.model.isMethodWithBody(method)) {
            body.set("dataMode", "params");
        }
    }
})