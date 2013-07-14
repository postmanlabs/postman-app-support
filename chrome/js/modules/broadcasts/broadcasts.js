pm.broadcasts = {
    items: [],

    init:function () {
        pm.storage.getValue("broadcasts", function(broadcasts) {
            pm.storage.getValue("broadcast_last_update_time", function(last_update_time) {
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
            });
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
        pm.storage.setValue({"broadcast_last_update_time": last_update.toUTCString()});
    },

    setBroadcasts:function (broadcasts) {
        var old_broadcasts;
        var broadcastsJson;
        var b;

        function oldBroadCastsFinder(br) {
            return br.id === b.id;
        }

        pm.storage.getValue("broadcasts", function(broadcastsJson) {
            if (broadcastsJson) {
                old_broadcasts = JSON.parse(broadcastsJson);
            }
            else {
                old_broadcasts = [];
            }

            var i, c, count;
            if (old_broadcasts.length === 0) {
                c = broadcasts.length;
                for (i = 0; i < c; i++) {
                    broadcasts[i]["status"] = "unread";
                }
                count = broadcasts.length;
                broadcastsJson = JSON.stringify(broadcasts);
                pm.storage.setValue({"broadcasts": broadcastsJson}, function() {
                });
            }
            else {
                c = broadcasts.length;
                var new_broadcasts = [];
                for (i = 0; i < c; i++) {
                    b = broadcasts[i];

                    var existing = _.find(old_broadcasts, oldBroadCastsFinder);

                    if (!existing) {
                        b["status"] = "unread";
                        new_broadcasts.push(b);
                    }
                }

                count = new_broadcasts.length;
                old_broadcasts = _.union(new_broadcasts, old_broadcasts);
                broadcastsJson = JSON.stringify(old_broadcasts);
                pm.storage.setValue({"broadcasts": broadcastsJson}, function() {
                });
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
        });
    },

    markAllAsRead:function () {
        var $broadcasts_count = $("#broadcasts-count");
        $broadcasts_count.removeClass();
        $broadcasts_count.addClass("no-new-broadcasts");
        $broadcasts_count.html("0");

        pm.storage.getValue("broadcasts", function(broadcastsJson) {
            var broadcasts;

            if (broadcastsJson) {
                broadcasts = JSON.parse(broadcastsJson);
            }
            else {
                broadcasts = [];
            }

            var c = broadcasts.length;
            for (var i = 0; i < c; i++) {
                broadcasts[i]["status"] = "read";
            }

            var outBroadcastsJsons = JSON.stringify(broadcasts);
            pm.storage.setValue({"broadcasts": outBroadcastsJsons}, function() {
            });

            pm.broadcasts.renderBroadcasts();
        });
    },

    renderBroadcasts:function () {
        pm.storage.getValue("broadcasts", function(broadcastsJson) {
            var broadcasts = JSON.parse(broadcastsJson);
            $("#broadcasts .dropdown-menu").html("");
            $("#broadcasts .dropdown-menu").append(Handlebars.templates.broadcasts({"items":broadcasts}));
        });
    }
};