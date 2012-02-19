(function($) {

    var methods = {
        //Not sure if this is needed
        settings: function() {
        },

        //Initialization
        init: function(options) {
            methods.settings = $.extend({}, $.fn.keyvalueeditor.defaults, options);

            return this.each(function() {
                var $this = $(this);
                var data = $this.data('keyvalueeditor');

                //Not already initialized
                if(!data) {
                    methods.settings.editor = $this;

                    data = {
                        settings: methods.settings,
                        editor: $this
                    };

                    var h = methods.getLastRow();
                    $this.append(h);

                    $this.on("focus.keyvalueeditor", '.keyvalueeditor-last', data, methods.focusEventHandler);
                    $this.on("blur.keyvalueeditor", '.keyvalueeditor-row input', data, methods.blurEventHandler);
                    $this.on("click.keyvalueeditor", '.keyvalueeditor-delete', data, methods.deleteRowHandler);

                    $(this).data('keyvalueeditor', data);
                }
            });
        },

        getLastRow: function() {
            var pKey = methods.settings.placeHolderKey;
            var pValue = methods.settings.placeHolderValue;

            var key = "";
            var value = "";

            var h;
            h = '<div class="keyvalueeditor-row keyvalueeditor-last">';
            h += '<input type="text" class="keyvalueeditor-key" placeHolder="' + pKey
                + '" name="keyvalueeditor-key"'
                + '"/>';
            h += '<input type="text" class="keyvalueeditor-value" placeHolder="' + pValue
                + '" name="keyvalueeditor-value"'
                + '"/>';
            h += '</div>';
            return h;
        },

        getNewRow: function(key, value) {
            var pKey = methods.settings.placeHolderKey;
            var pValue = methods.settings.placeHolderValue;

            key = key ? key : "";
            value = value ? value : "";

            var h;
            h = '<div class="keyvalueeditor-row">';
            h += '<input type="text" class="keyvalueeditor-key" placeHolder="' + pKey
                + '" name="keyvalueeditor-' + key
                + '" value="' + key
                + '"/>';
            h += '<input type="text" class="keyvalueeditor-value" placeHolder="' + pValue
                + '" name="keyvalueeditor-' + value
                + '" value="' + value
                + '"/>';
            h += methods.getDeleteLink();
            h += '</div>';
            return h;
        },

        getDeleteLink: function() {
            return '<a href="javascript:void(0);" tabindex="-1" class="keyvalueeditor-delete">' + methods.settings.deleteButton + '</a>';
        },


        deleteRowHandler: function(event) {
            var target = event.currentTarget;
            $(target).parent().remove();
            methods.settings.onDeleteRow();
        },

        focusEventHandler: function(event) {
            var params = {key: "", value: ""};
            var editor = event.data.editor;
            $(this).removeClass('keyvalueeditor-last');
            var row = methods.getLastRow();
            $(this).find('.keyvalueeditor-value').after(methods.getDeleteLink());
            $(this).after(row);
        },

        blurEventHandler: function(event) {
            methods.settings.onBlurElement();
        },

        //For external use
        addParam: function(param) {
            //Add delete link to the last element
            $(methods.settings.editor).find('.keyvalueeditor-last').before(methods.getNewRow(param.key, param.value));
        },

        addParams: function(params) {
            var count = params.length;
            for(var i = 0; i < count; i++) {
                var param = params[i];
                methods.addParam(param);
            }
        },

        getValues: function() {
            var pairs = [];
            $(this).find('.keyvalueeditor-row').each(function() {
                var key = $(this).find('.keyvalueeditor-key').val();
                var value = $(this).find('.keyvalueeditor-value').val();

                if(key) {
                    var pair = {
                        key: key,
                        value: value
                    };

                    pairs.push(pair);
                }
            });

            return pairs;
        },

        clear: function() {
            $(methods.settings.editor).find('.keyvalueeditor-row').each(function() {
                $(this).remove();
            });

            var h = methods.getLastRow();
            methods.settings.editor.append(h);
        },

        reset: function(params) {
            methods.clear();
            if(params) {
                methods.addParams(params);
            }
        },

        destroy: function() {
            return this.each(function() {
                //unbind listeners if needed
            });
        }
    };

    $.fn.keyvalueeditor = function(method) {
        //Method calling logic
        if(methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if(typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.keyvalueeditor');
        }
    };

    $.fn.keyvalueeditor.defaults = {
        type: "normal",
        fields: 2,
        deleteButton: "Delete",
        placeHolderKey: "Key",
        placeHolderValue: "Value",
        onBlurElement: function() {},
        onDeleteRow: function() {}
    };

})(jQuery);
