(function ($) {

    var methods = {
        //Not sure if this is needed
        settings:function () {
        },

        //Initialization
        init:function (options) {
            methods.settings = $.extend({}, $.fn.keyvalueeditor.defaults, options);

            return this.each(function () {
                var $this = $(this);
                var data = $this.data('keyvalueeditor');

                //Not already initialized
                if (!data) {
                    data = {
                        settings:methods.settings,
                        editor:$this
                    };

                    var h = methods.getLastRow(data);
                    $this.append(h);

                    $this.on("focus.keyvalueeditor", '.keyvalueeditor-last', data, methods.focusEventHandler);
                    $this.on("focus.keyvalueeditor", '.keyvalueeditor-row input', data, methods.rowFocusEventHandler);
                    $this.on("blur.keyvalueeditor", '.keyvalueeditor-row input', data, methods.blurEventHandler);
                    $this.on("change.keyvalueeditor", '.keyvalueeditor-valueTypeSelector ', data, methods.valueTypeSelectEventHandler);
                    $this.on("click.keyvalueeditor", '.keyvalueeditor-delete', data, methods.deleteRowHandler);

                    $(this).data('keyvalueeditor', data);
                }
            });
        },

        getLastRow:function (state) {
            var settings = state.settings;
            var pKey = settings.placeHolderKey;
            var pValue = settings.placeHolderValue;
            var valueTypes = settings.valueTypes;

            var key = "";
            var value = "";

            var h;
            h = '<div class="keyvalueeditor-row keyvalueeditor-last">';
            h += '<input type="text" class="keyvalueeditor-key" placeHolder="' + pKey
                + '" name="keyvalueeditor-key"'
                + '"/>';
            h += '<input type="text" class="keyvalueeditor-value keyvalueeditor-value-text" placeHolder="' + pValue
                + '" name="keyvalueeditor-value"'
                + '"/>';

            if ($.inArray("file", valueTypes) >= 0) {
                h += '<input type="file" multiple class="keyvalueeditor-value keyvalueeditor-value-file" placeHolder="' + pValue
                    + '" name="keyvalueeditor-value'
                    + '" value="' + value
                    + '" style="display: none;"/>';

                h += '<select class="keyvalueeditor-valueTypeSelector"><option value="text" selected>Text</option>' +
                    '<option value="file">File</option></select>';
            }

            h += '</div>';
            return h;
        },

        getNewRow:function (key, value, type, state) {
            var settings = state.settings;
            var pKey = settings.placeHolderKey;
            var pValue = settings.placeHolderValue;
            var valueTypes = settings.valueTypes;

            key = key ? key : "";
            value = value ? value : "";

            key = key.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            value = value.replace(/'/g, "&apos;").replace(/"/g, "&quot;");

            var h;
            h = '<div class="keyvalueeditor-row">';
            h += '<input type="text" class="keyvalueeditor-key" placeHolder="' + pKey
                + '" name="keyvalueeditor-' + key
                + '" value="' + key
                + '"/>';            

            if ($.inArray("file", valueTypes) >= 0) {                
                if (type === "file") {
                    h += '<input type="text" class="keyvalueeditor-value keyvalueeditor-value-text" placeHolder="' + pValue
                        + '" name="keyvalueeditor-' + value
                        + '" value="' + value
                        + '" style="display: none;"/>';

                    h += '<input type="file" multiple class="keyvalueeditor-value keyvalueeditor-value-file" placeHolder="' + pValue
                        + '" name="keyvalueeditor-' + value
                        + '" value="' + value
                        + '"/>';

                    h += '<select class="keyvalueeditor-valueTypeSelector"><option value="text">Text</option>' +
                        '<option value="file" selected>File</option></select>';
                }                    
                else {
                    h += '<input type="text" class="keyvalueeditor-value keyvalueeditor-value-text" placeHolder="' + pValue
                        + '" name="keyvalueeditor-' + value
                        + '" value="' + value
                        + '"/>';

                    h += '<input type="file" multiple class="keyvalueeditor-value keyvalueeditor-value-file" placeHolder="' + pValue
                        + '" name="keyvalueeditor-' + value
                        + '" value="' + value
                        + '" style="display: none;"/>';

                    h += '<select class="keyvalueeditor-valueTypeSelector"><option value="text" selected>Text</option>' +
                        '<option value="file">File</option></select>';
                }
            }
            else {
                h += '<input type="text" class="keyvalueeditor-value keyvalueeditor-value-text" placeHolder="' + pValue
                        + '" name="keyvalueeditor-' + value
                        + '" value="' + value
                        + '"/>';
            }

            h += methods.getDeleteLink(state);
            h += '</div>';
            return h;
        },

        getDeleteLink:function (state) {
            return '<a tabindex="-1" class="keyvalueeditor-delete">' + state.settings.deleteButton + '</a>';
        },


        deleteRowHandler:function (event) {
            var target = event.currentTarget;
            $(target).parent().remove();
            var data = event.data;
            data.settings.onDeleteRow();
        },

        valueTypeSelectEventHandler:function (event) {
            var target = event.currentTarget;
            var valueType = $(target).val();
            var valueTypes = event.data.settings.valueTypes;
            for (var i = 0; i < valueTypes.length; i++) {
                $(target).parent().find('.keyvalueeditor-value').css("display", "none");
            }
            $(target).parent().find('input[type="' + valueType + '"]').css("display", "inline-block");
        },

        focusEventHandler:function (event) {
            var params = {key:"", value:""};
            var editor = event.data.editor;
            $(this).removeClass('keyvalueeditor-last');
            var row = methods.getLastRow(event.data);
            if (event.data.settings.valueTypes.length > 1) {
                $(this).find('select:last').after(methods.getDeleteLink(event.data));
            }
            else {
                $(this).find('input:last').after(methods.getDeleteLink(event.data));
            }

            $(this).after(row);
        },

        rowFocusEventHandler:function (event) {
            var data = event.data;
            data.settings.onFocusElement();
        },

        blurEventHandler:function (event) {
            var data = event.data;
            data.settings.onBlurElement();
        },

        //For external use
        addParam:function (param, state) {                
            if(!("type" in param)) {
                param.type = "text";                    
            }

            $(state.editor).find('.keyvalueeditor-last').before(methods.getNewRow(param.key, param.value, param.type, state));
        },

        //Check for duplicates here
        addParams:function (params, state) {
            if (!state) {
                state = $(this).data('keyvalueeditor');
            }

            var count = params.length;
            for (var i = 0; i < count; i++) {
                var param = params[i];
                methods.addParam(param, state);
            }
        },

        getValues:function () {
            var pairs = [];
            $(this).find('.keyvalueeditor-row').each(function () {
                var key = $(this).find('.keyvalueeditor-key').val();
                var value = $(this).find('.keyvalueeditor-value').val();                
                var type = $(this).find('.keyvalueeditor-valueTypeSelector').val();
                
                if (type === undefined) {
                    type = "text";
                }

                if (key) {
                    var pair = {
                        key:key,
                        value:value,
                        type:type
                    };

                    pairs.push(pair);
                }
            });

            return pairs;
        },

        getElements:function () {
            var rows = [];
            var state = $(this).data('keyvalueeditor');
            var valueTypes = state.settings.valueTypes;
            $(this).find('.keyvalueeditor-row').each(function () {
                var keyElement = $(this).find('.keyvalueeditor-key');
                var valueElement;
                var type = "text";
                if ($.inArray("file", valueTypes)) {
                    type = $(this).find('.keyvalueeditor-valueTypeSelector').val();
                    if (type === "file") {
                        valueElement = $(this).find('.keyvalueeditor-value-file');
                    }
                    else {
                        valueElement = $(this).find('.keyvalueeditor-value-text');
                    }
                }
                else {
                    valueElement = $(this).find('.keyvalueeditor-value-text');
                }


                if (keyElement.val()) {
                    var row = {
                        keyElement:keyElement,
                        valueElement:valueElement,
                        valueType:type
                    };

                    rows.push(row);
                }
            });
            return rows;
        },

        clear:function (state) {
            $(state.editor).find('.keyvalueeditor-row').each(function () {
                $(this).remove();
            });

            var h = methods.getLastRow(state);
            $(state.editor).append(h);
        },

        reset:function (params) {
            var state = $(this).data('keyvalueeditor');
            methods.clear(state);
            if (params) {
                methods.addParams(params, state);
            }

            state.settings.onReset();
        },

        add:function (params) {
            var state = $(this).data('keyvalueeditor');
            methods.clear(state);
            if (params) {
                methods.addParams(params, state);
            }
        },

        destroy:function () {
            return this.each(function () {
                //unbind listeners if needed
            });
        }
    };

    $.fn.keyvalueeditor = function (method) {
        //Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.keyvalueeditor');
        }
    };

    $.fn.keyvalueeditor.defaults = {
        type:"normal",
        fields:2,
        deleteButton:"Delete",
        placeHolderKey:"Key",
        placeHolderValue:"Value",
        valueTypes:["text"],
        onInit:function () {
        },
        onReset:function () {
        },
        onFocusElement:function () {
        },
        onBlurElement:function () {
        },
        onDeleteRow:function () {
        },
        onAddedParam:function () {
        }
    };

})(jQuery);
