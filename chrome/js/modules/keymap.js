pm.keymap = {
    init:function () {
        var clearHistoryHandler = function () {
            if(pm.layout.isModalOpen) return;

            pm.history.clear();
            return false;
        };

        var urlFocusHandler = function () {
            if(pm.layout.isModalOpen) return;

            $('#url').focus();
            return false;
        };

        var newRequestHandler = function () {
            if(pm.layout.isModalOpen) return;

            pm.request.startNew();
        };

        $('body').on('keydown', 'input', function (event) {
            if(pm.layout.isModalOpen) return;

            if (event.keyCode === 27) {
                $(event.target).blur();
            }
            else if (event.keyCode == 13) {
                pm.request.send("text");
            }

            return true;
        });

        $('body').on('keydown', 'textarea', function (event) {            
            if(pm.layout.isModalOpen) return;

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
        
        $(document).bind('keydown', 'alt+p', function() {
            pm.request.handlePreviewClick();
        });

        $(document).bind('keydown', 'q', function () {            
            pm.envManager.quicklook.toggleDisplay();
            return false;
        });

        $(document).bind('keydown', 'e', function () {
            if(pm.layout.isModalOpen) return;

            $('#modal-environments').modal({
                keyboard:true,
                backdrop:"static"
            });
        });


        $(document).bind('keydown', 'h', function () {
            if(pm.layout.isModalOpen) return;

            pm.request.openHeaderEditor();
            $('#headers-keyvaleditor div:first-child input:first-child').focus();
            return false;
        });

        $(document).bind('keydown', 'return', function () {            
            if(pm.layout.isModalOpen) return;

            pm.request.send("text");
            return false;
        });

        $(document).bind('keydown', 'p', function () {
            if(pm.layout.isModalOpen) return;

            if (pm.request.isMethodWithBody(pm.request.method)) {
                $('#formdata-keyvaleditor div:first-child input:first-child').focus();
                return false;
            }
        });

        $(document).bind('keydown', 'f', function () {
            if(pm.layout.isModalOpen) return;

            pm.request.response.toggleBodySize();
        });

        $(document).bind('keydown', 'esc', function () {
            if(pm.layout.isModalOpen) {
                var activeModal = pm.layout.activeModal;
                if(activeModal !== "") {
                    $(activeModal).modal("hide");
                }
            }
        });

        $(document).bind('keydown', 'shift+/', function () {
            if(pm.layout.isModalOpen) return;

            $('#modal-shortcuts').modal({
                keyboard: true
            });

            $('#modal-shortcuts').modal('show');
        });

        $(document).bind('keydown', 'a', function () {
            if(pm.layout.isModalOpen) return;
            
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