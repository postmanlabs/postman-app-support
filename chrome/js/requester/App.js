var App = Backbone.View.extend({
	initialize:function () {
		var variableProcessor = this.model.get("variableProcessor");
		var globals = this.model.get("globals");

		this.on("modalClose", this.onModalClose, this);
		this.on("modalOpen", this.onModalOpen, this);

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

	    var donated = pm.settings.getSetting("haveDonated");

	    if(donated) {
	    	$("#donate-link").css("display", "none");
	    }
	    else {
	    	$("#donate-link").css("display", "inline");
	    }

	    pm.mediator.on("donatedStatusChanged", function(donated) {
	    	if(donated) {
	    		$("#donate-link").css("display", "none");
	    	}
	    	else {
	    		$("#donate-link").css("display", "inline");
	    	}
	    });

	    pm.mediator.on("notifySuccess", function(message) {
	    	noty(
	    	    {
	    	        type:'success',
	    	        text: message,
	    	        layout:'topCenter',
	    	        timeout:750
	    	    });
	    });

	    pm.mediator.on("notifyError", function(message) {
	    	noty(
	    	    {
	    	        type:'error',
	    	        text: message,
	    	        layout:'topCenter',
	    	        timeout:750
	    	    });
	    });

	    pm.mediator.on("error", function() {
	    	noty(
	    	    {
	    	        type:'error',
	    	        text:'Something went wrong.',
	    	        layout:'topCenter',
	    	        timeout:750
	    	    });
	    });

	    pm.mediator.on("openModule", this.openModule, this);

	    this.renderContextMenu();
	    this.setLayout();
	},

	createOrUpdateContextMenuItem: function(id, title, parentId) {
		var view = this;

		var contextMenuIds = view.contextMenuIds;
		var obj = {
			title: title,
			contexts: ['selection']
		};

		if (contextMenuIds[id]) {
			id = chrome.contextMenus.update(id, obj);
		}
		else {
			obj.id = id;
			if (parentId) {
				obj.parentId = parentId;
			}
			id = chrome.contextMenus.create(obj);
			contextMenuIds[id] = true;
		}
	},

	createEnvironmentContextMenu: function(environment) {
		var view = this;
		var i;
		var count;
		var targetId;
		var value;
		var values;

		if (environment) {
			targetId = view.menuIdPrefix + "/postman_current_environment";

			this.createOrUpdateContextMenuItem(targetId, "Set: " + environment.get("name"), false);

			values = environment.get("values");
			count = values.length;

			for(i = 0; i < count; i++) {
				value = values[i];
				targetId = view.menuIdPrefix + "/environment/" + value.key;
				this.createOrUpdateContextMenuItem(targetId, value.key, view.menuIdPrefix + "/postman_current_environment");
			}
		}
	},

	createGlobalsContextMenu: function(globals) {
		var view = this;
		var i;
		var count;
		var targetId;
		var value;
		var values;

		if (globals) {
			targetId = view.menuIdPrefix + "/postman_globals";
			this.createOrUpdateContextMenuItem(targetId, "Set: Globals", false);

			values = globals.get("globals");
			count = values.length;

			for(i = 0; i < count; i++) {
				value = values[i];
				targetId = view.menuIdPrefix + "/globals/" + value.key;
				this.createOrUpdateContextMenuItem(targetId, value.key, view.menuIdPrefix + "/postman_globals");
			}
		}
	},


	createContextMenu: function(environment, globals) {
		this.createEnvironmentContextMenu(environment);
		this.createGlobalsContextMenu(globals);
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
		// Shift focus to disable last shown tooltip
		$("#url").focus();
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
	    var newMainHeight = $(document).height() - 55;
	    $('#main').height(newMainHeight + "px");
	    var newMainWidth = $('#container').width() - $('#sidebar').width() - 10;
	    $('#main').width(newMainWidth + "px");

	    $('#directory-browser').height(newMainHeight + "px");
	},

	openModule: function(module) {
		if (module === "requester") {
			$("#directory-browser").css("display", "none");
			$("#main-container").css("display", "block");
			pm.mediator.trigger("showSidebar");
		}
		else if (module === "directory") {
			$("#main-container").css("display", "none");
			$("#directory-browser").css("display", "block");
			pm.mediator.trigger("hideSidebar");
		}
		else if (module === "test_runner") {
		}
	}
});