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
            ga('send', 'event', 'broadcast', 'view');
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
