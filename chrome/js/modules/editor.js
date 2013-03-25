pm.editor = {
    mode:"html",
    codeMirror:null,
    charCount:0,

    //Defines a links mode for CodeMirror
    init:function () {
        CodeMirror.defineMode("links", function (config, parserConfig) {
            console.log("Defining mode");
            var linksOverlay = {
                startState:function () {
                    return { "link":"" }
                },

                token:function (stream, state) {                    
                    if (stream.eatSpace()) {                        
                        return null;
                    }

                    var matches;
                    var targetString = stream.string.substr(stream.start);

                    if (matches = targetString.match(/https?:\/\/[^\\'"\n\t\s]*(?=[<"'\n\t\s])/, false)) {
                        //Eat all characters before http link                        
                        var m = targetString.match(/.*(?=https?:)/, true);
                        if (m) {
                            if (m[0].length > 0) {                                
                                stream.next();
                                return null;
                            }
                        }

                        var match = matches[0];
                        if (match != state.link) {
                            state.link = matches[0];
                            for (var i = 0; i < state.link.length; i++) {
                                stream.next();
                            }
                            state.link = "";
                            return "link";
                        }

                        stream.skipToEnd();
                        return null;
                    }

                    stream.skipToEnd();
                    return null;

                }
            };

            return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || pm.editor.mode), linksOverlay);
        });
    },

    //Refactor this
    toggleLineWrapping:function () {
        var lineWrapping = pm.editor.codeMirror.getOption("lineWrapping");
        if (lineWrapping === true) {
            $('#response-body-line-wrapping').removeClass("active");
            lineWrapping = false;
            pm.editor.codeMirror.setOption("lineWrapping", false);
        }
        else {
            $('#response-body-line-wrapping').addClass("active");
            lineWrapping = true;
            pm.editor.codeMirror.setOption("lineWrapping", true);
        }

        pm.settings.set("lineWrapping", lineWrapping);
        pm.editor.codeMirror.refresh();
    }
};