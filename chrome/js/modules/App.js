var App = Backbone.View.extend({
	initialize:function () {
		var variableProcessor = this.model.get("variableProcessor");
		var globals = this.model.get("globals");

		variableProcessor.on('change:selectedEnv', this.renderContextMenu, this);
		globals.on('change', this.renderContextMenu, this);

		var view = this;

	    $('a[rel="tooltip"]').tooltip();	    
	    $('input[rel="popover"]').popover();

	    var resizeTimeout;

	    $(window).on("resize", function () {	        
	        clearTimeout(resizeTimeout);
	        resizeTimeout = setTimeout(function() {	            
	            view.setLayout();
	        }, 500);
	    });

	    $('body').on('keydown', 'textarea', function (event) {
	        if(view.isModalOpen()) {
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
	        if(view.isModalOpen()) {
	            var activeModal = view.model.get("activeModal");
	            if(activeModal !== "") {
	                $(activeModal).modal("hide");
	            }
	        }
	    });

	    this.renderContextMenu();
	    this.setLayout();
	},

	createContextMenu: function(environment, globals) {
		var view = this;

		chrome.contextMenus.removeAll(function() {
			try {
				view.menuIdPrefix = guid();

				if (environment) {
					chrome.contextMenus.create({
						title: "Set: " + environment.get("name"),		      
						id: view.menuIdPrefix + "postman_current_environment",
						contexts: ['selection']
					});


					var values = environment.get("values");
					var count = values.length;
					var value;

					for(var i = 0; i < count; i++) {
						value = values[i];
						chrome.contextMenus.create({
							title: value.key,
							id: view.menuIdPrefix + "/environment/" + value.key,
							parentId: view.menuIdPrefix + "postman_current_environment",
							contexts: ['selection']
						});
					}
				}

				if (globals) {
					chrome.contextMenus.create({
						title: "Set: Globals",
						id: view.menuIdPrefix + "postman_globals",
						contexts: ['selection']
					});

					var values = globals.get("globals");		
					var count = values.length;
					var value;

					for(var i = 0; i < count; i++) {
						value = values[i];
						chrome.contextMenus.create({
							title: value.key,
							id: view.menuIdPrefix + "/globals/" + value.key,
							parentId: view.menuIdPrefix + "postman_globals",
							contexts: ['selection']
						});
					}
				}
			}
			catch(e) {
				console.log(e);
			}
			
		});					
	},

	renderContextMenu: function() {
		var variableProcessor = this.model.get("variableProcessor");
		var globals = this.model.get("globals");
		var environment = variableProcessor.get("selectedEnv");		
		var view = this;

		chrome.contextMenus.removeAll(function() {			
			_.bind(view.createContextMenu, view)(environment, globals);
		});

		chrome.contextMenus.onClicked.addListener(function(info) {
			if (!document.hasFocus()) {
				console.log('Ignoring context menu click that happened in another window');
				return;
			}

			var menuItemParts = info.menuItemId.split("/");
			var category = menuItemParts[1];
			var variable = menuItemParts[2];

			_.bind(view.updateVariableFromContextMenu, view)(category, variable, info.selectionText);			
		});		
	},

	updateGlobalVariableFromContextMenu: function(variable, selectionText) {		
		var variableProcessor = this.model.get("variableProcessor");
		var globals = this.model.get("globals");
		var globalValues = _.clone(globals.get("globals"));

		var count = globalValues.length;
		var value;

		for(var i = 0; i < count; i++) {
			value = globalValues[i];
			if (value.key === variable) {
				value.value = selectionText;
				break;
			}
		}

		globals.saveGlobals(globalValues);
		globals.trigger("change");
	},

	updateVariableFromContextMenu: function(category, variable, selectionText) {
		if (category === "globals") {
			this.updateGlobalVariableFromContextMenu(variable, selectionText);			
		}
		else if (category === "environment") {

		}
	},

	onModalOpen:function (activeModal) {
		this.model.set("activeModal", activeModal);
		this.model.set("isModalOpen", true);	    
	},

	onModalClose:function () {
		this.model.set("activeModal", null);
		this.model.set("isModalOpen", false);	    
	},

	isModalOpen: function() {
		return this.model.get("isModalOpen");
	},

	setLayout:function () {
	    this.refreshScrollPanes();
	},

	refreshScrollPanes:function () {
	    var newMainWidth = $('#container').width() - $('#sidebar').width() - 10;
	    var newMainHeight = $(document).height() - 55;
	    $('#main').width(newMainWidth + "px");
	    $('#main').height(newMainHeight + "px");
	}
});