pm.editor = {
    mode:"html",
    codeMirror:null,
    charCount:0,

    //Defines a links mode for CodeMirror
    init:function () {
        console.log("Initializing CodeMirror mode");
        CodeMirror.defineMode("links", function (config, parserConfig) {
            var linksOverlay = {
                startState:function () {
                    return { "link":"" }
                },

                token:function (stream, state) {                   
                    if (stream.eatSpace()) {
                        console.log("Returning null eatSpace", stream);
                        return null;
                    }

                    var matches;
                    if (matches = stream.string.match(/https?:\/\/[^\\'"\n\t\s]*(?=[<"'\n\t\s])/, false)) {
                        //Eat all characters before http link
                        var m = stream.string.match(/.*(?=https?:)/, true);
                        if (m) {
                            if (m[0].length > 0) {
                                console.log("Returning null", stream);
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
                            console.log("Returning link");
                            return "link";
                        }

                        stream.skipToEnd();
                        console.log("Returning null skipToEnd", stream);
                        return null;
                    }

                    stream.skipToEnd();
                    console.log("Returning null skipToEnd", stream);
                    return null;

                }
            };

            console.log("Defined mode");       
            return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || pm.editor.mode), linksOverlay);
        });
    },

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
    }
};