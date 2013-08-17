var ResponseCookieViewer = Backbone.View.extend({
    initialize: function() {
        var model = this.model;
        var response = model.get("response");
        response.on("finishedLoadResponse", this.load, this);
    },

    load: function() {
        var model = this.model;
        var response = model.get("response");
        var cookies = response.get("cookies");

        if (cookies) {
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
                    cookie.name = limitStringLineWidth(cookie.name, 20);
                    cookie.value = limitStringLineWidth(cookie.value, 20);
                    cookie.path = limitStringLineWidth(cookie.path, 20);
                    if ("expirationDate" in cookie) {
                        var date = new Date(cookie.expirationDate * 1000);
                        cookies[i].expires = date.toLocaleString();
                    }
                }

                $('#response-cookies-items').html(Handlebars.templates.response_cookies({"items":cookies}));
            }
        }

    }
});