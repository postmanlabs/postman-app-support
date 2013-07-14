var HelperManager = Backbone.View.extend({
    initialize: function() {
        this.model.on("change:activeHelper", this.render, this);

        var view = this;

        $("#request-types .request-helper-tabs li").on("click", function () {
            $("#request-types .request-helper-tabs li").removeClass("active");
            $(event.currentTarget).addClass("active");
            var type = $(event.currentTarget).attr('data-id');
            view.showRequestHelper(type);
            view.render();
        });
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