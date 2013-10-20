var ResponseBodyPrettyViewer = Backbone.View.extend({
	defineCodeMirrorLinksMode:function () {
	    var editorMode = this.mode;

	    CodeMirror.defineMode("links", function (config, parserConfig) {
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
	                    if (match !==state.link) {
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

	        return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || editorMode), linksOverlay);
	    });
	},

	toggleLineWrapping:function () {
	    var codeMirror = this.codeMirror;

	    var lineWrapping = codeMirror.getOption("lineWrapping");
	    if (lineWrapping === true) {
	        $('#response-body-line-wrapping').removeClass("active");
	        lineWrapping = false;
	        codeMirror.setOption("lineWrapping", false);
	    }
	    else {
	        $('#response-body-line-wrapping').addClass("active");
	        lineWrapping = true;
	        codeMirror.setOption("lineWrapping", true);
	    }

	    pm.settings.setSetting("lineWrapping", lineWrapping);
	    codeMirror.refresh();
	},

    initialize: function() {
    	this.codeMirror = null;
    	this.mode = "text";
    	this.defineCodeMirrorLinksMode();

    	pm.cmp = this.codeMirror;

    	pm.mediator.on("focusPrettyViewer", this.onFocusPrettyViewer, this);
    },

    onFocusPrettyViewer: function() {
    	console.log("Trigger keydown on CodeMirror");
    }
});
