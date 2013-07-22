var App = Backbone.View.extend({
	initialize:function () {
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

	    this.setLayout();
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