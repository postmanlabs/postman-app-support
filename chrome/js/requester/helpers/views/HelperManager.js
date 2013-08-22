var HelperManager = Backbone.View.extend({
    initialize: function() {
        var model = this.model;

        var basicAuthForm = new BasicAuthForm({model: model.get("basicAuth")});
        var digestAuthForm = new DigestAuthForm({model: model.get("digestAuth")});
        var oAuth1Form = new OAuth1Form({model: model.get("oAuth1")});
        var oAuth2Manager = new OAuth2Manager({model: model.get("oAuth2")});

        this.model.on("change:activeHelper", this.render, this);

        var request = model.get("request");

        request.on("loadRequest", this.onLoadRequest, this);

        var view = this;

        $("#request-types .request-helper-tabs li").on("click", function () {
            $("#request-types .request-helper-tabs li").removeClass("active");
            $(event.currentTarget).addClass("active");
            var type = $(event.currentTarget).attr('data-id');
            view.showRequestHelper(type);
            view.render();
        });
    },

    onLoadRequest: function() {
        this.showRequestHelper("normal");
    },

    getActiveHelperType: function() {
        return this.model.get("activeHelper");
    },

    getHelper: function(type) {
        return this.model.get(type);
    },

    showRequestHelper: function (type) {
        this.model.set("activeHelper", type);
        return false;
    },

    render: function() {
        var type = this.model.get("activeHelper");

        $("#request-types ul li").removeClass("active");
        $('#request-types ul li[data-id=' + type + ']').addClass('active');
        if (type !== "normal") {
            $('#request-helpers').css("display", "block");
        }
        else {
            $('#request-helpers').css("display", "none");
        }

        if (type.toLowerCase() === 'oauth1') {
            this.model.get("oAuth1").generateHelper();
        }

        $('.request-helpers').css("display", "none");
        $('#request-helper-' + type).css("display", "block");
    }
});