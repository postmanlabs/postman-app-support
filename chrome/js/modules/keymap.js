pm.keymap = {
    init:function () {
        $('body').on('keydown', 'textarea', function (event) {
            if(pm.layout.isModalOpen) {
                return;
            }

            if (event.keyCode === 27) {
                $(event.target).blur();
            }
        });

        $('body').on('keydown', 'select', function (event) {
            if (event.keyCode === 27) {
                $(event.target).blur();
            }
        });

        $(document).bind('keydown', 'esc', function () {
            if(pm.layout.isModalOpen) {
                var activeModal = pm.layout.activeModal;
                if(activeModal !== "") {
                    $(activeModal).modal("hide");
                }
            }
        });                  
    }
};