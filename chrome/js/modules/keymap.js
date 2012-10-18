pm.keymap = {
    init:function () {
        var clearHistoryHandler = function () {
            pm.history.clear();
            return false;
        };

        var urlFocusHandler = function () {
            $('#url').focus();
            return false;
        };

        var newRequestHandler = function () {
            pm.request.startNew();
        };

        $('body').on('keydown', 'input', function (event) {
            if (event.keyCode === 27) {
                $(event.target).blur();
            }
            else if (event.keyCode == 13) {
                pm.request.send("text");
            }

            return true;
        });

        $('body').on('keydown', 'textarea', function (event) {
            if (event.keyCode === 27) {
                $(event.target).blur();
            }
        });

        $('body').on('keydown', 'select', function (event) {
            if (event.keyCode === 27) {
                $(event.target).blur();
            }
        });

        $(document).bind('keydown', 'alt+c', clearHistoryHandler);
        $(document).bind('keydown', 'backspace', urlFocusHandler);
        $(document).bind('keydown', 'alt+n', newRequestHandler);

        $(document).bind('keydown', 'q', function () {
            pm.envManager.quicklook.toggleDisplay();
            return false;
        });

        $(document).bind('keydown', 'e', function () {
            $('#modal-environments').modal({
                keyboard:true,
                backdrop:"static"
            });
        });


        $(document).bind('keydown', 'h', function () {
            pm.request.openHeaderEditor();
            $('#headers-keyvaleditor div:first-child input:first-child').focus();
            return false;
        });

        $(document).bind('keydown', 'return', function () {
            pm.request.send("text");
            return false;
        });

        $(document).bind('keydown', 'p', function () {
            if (pm.request.isMethodWithBody(pm.request.method)) {
                $('#formdata-keyvaleditor div:first-child input:first-child').focus();
                return false;
            }
        });

        $(document).bind('keydown', 'f', function () {
            pm.request.response.toggleBodySize();
        });

        $(document).bind('keydown', 'shift+/', function () {
            $('#modal-shortcuts').modal('show');
        });

        $(document).bind('keydown', 'a', function () {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }

            $('#modal-add-to-collection').modal({
                keyboard:true,
                backdrop:"static"
            });
            $('#modal-add-to-collection').modal('show');

            $('#new-request-name').val("");
            $('#new-request-description').val("");
            return false;
        });
    }
};