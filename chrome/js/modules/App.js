var App = Backbone.View.extend({
	initialize:function () {
		var variableProcessor = this.model.get("variableProcessor");
		var globals = this.model.get("globals");

		variableProcessor.on('change:selectedEnv', this.renderContextMenu, this);
		globals.on('change', this.renderContextMenu, this);

		var view = this;
		view.menuIdPrefix = guid();
		view.contextMenuIds = {};

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
		var contextMenuIds = view.contextMenuIds;
		var i;
		var count;
		var id;			
		var targetId;
		var value;
		var values;

		if (environment) {
			targetId = view.menuIdPrefix + "/postman_current_environment";

			if (contextMenuIds[targetId]) {
				id = chrome.contextMenus.update(targetId,
				{
					title: "Set: " + environment.get("name"),						
					contexts: ['selection']
				});
			}
			else {
				id = chrome.contextMenus.create({
					title: "Set: " + environment.get("name"),		      
					id: targetId,
					contexts: ['selection']
				});

				contextMenuIds[id] = true;	
			}
			

			values = environment.get("values");
			count = values.length;				

			for(i = 0; i < count; i++) {
				value = values[i];
				targetId = view.menuIdPrefix + "/environment/" + value.key;

				if (contextMenuIds[targetId]) {
					chrome.contextMenus.update(targetId,
					{
						title: value.key,							
						parentId: view.menuIdPrefix + "/postman_current_environment",
						contexts: ['selection']
					});
				}
				else {
					id = chrome.contextMenus.create({
						title: value.key,
						id: targetId,
						parentId: view.menuIdPrefix + "/postman_current_environment",
						contexts: ['selection']
					});

					contextMenuIds[id] = true;	
				}
				
			}
		}

		if (globals) {
			targetId = view.menuIdPrefix + "/postman_globals";			
			if(contextMenuIds[targetId]) {
				chrome.contextMenus.update(targetId,
				{
					title: "Set: Globals",						
					contexts: ['selection']
				});
			}
			else {
				id = chrome.contextMenus.create({
					title: "Set: Globals",
					id: targetId,
					contexts: ['selection']
				});

				contextMenuIds[id] = true;
			}				

			values = globals.get("globals");		
			count = values.length;		

			for(i = 0; i < count; i++) {
				value = values[i];
				targetId = view.menuIdPrefix + "/globals/" + value.key;
				if(contextMenuIds[targetId]) {
					chrome.contextMenus.update(targetId,
					{
						title: value.key,							
						parentId: view.menuIdPrefix + "/postman_globals",
						contexts: ['selection']
					});
				}
				else {
					id = chrome.contextMenus.create({
						title: value.key,
						id: targetId,
						parentId: view.menuIdPrefix + "/postman_globals",
						contexts: ['selection']
					});

					contextMenuIds[id] = true;
				}
				
			}
		}
	},

	renderContextMenu: function() {
		var variableProcessor = this.model.get("variableProcessor");
		var globals = this.model.get("globals");
		var environment = variableProcessor.get("selectedEnv");		
		var view = this;		

		chrome.contextMenus.removeAll(function() {
			view.contextMenuIds = {};
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

	updateEnvironmentVariableFromContextMenu: function(variable, selectionText) {
		var variableProcessor = this.model.get("variableProcessor");
		var environments = this.model.get("environments");
		var selectedEnv = variableProcessor.get("selectedEnv");

		if (selectedEnv) {			
			var values = _.clone(selectedEnv.get("values"));
			var count = values.length;
			for(var i = 0; i < count; i++) {
				value = values[i];
				if (value.key === variable) {
					value.value = selectionText;
					break;
				}
			}
			var id = selectedEnv.get("id");
			var name = selectedEnv.get("name");
			environments.updateEnvironment(id, name, values);
		}
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
		globals.trigger("change:globals");
	},

	updateVariableFromContextMenu: function(category, variable, selectionText) {
		if (category === "globals") {
			this.updateGlobalVariableFromContextMenu(variable, selectionText);			
		}
		else if (category === "environment") {
			this.updateEnvironmentVariableFromContextMenu(variable, selectionText);
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