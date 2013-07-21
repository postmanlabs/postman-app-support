var Sidebar = Backbone.View.extend({
    initialize: function() {
    	var historySidebar = new HistorySidebar({model: this.model.get("history")});
    	var collectionSidebar = new CollectionSidebar({model: this.model.get("collections")});
    	var view = this;

    	var searchState = new SearchState({
    		history: this.model.get("history"), 
    		collections: this.model.get("collections")
    	});

    	var searchForm = new SearchForm({model: searchState});

    	var activeSidebarSection = pm.settings.getSetting("activeSidebarSection");

    	if (activeSidebarSection) {
    	    this.select(activeSidebarSection);
    	}
    	else {
    	    this.select("history");
    	}            

    	$('#sidebar-selectors li').click(function () {
    	    var id = $(this).attr('data-id');
    	    view.select(id);
    	});

    	$(":input:first").focus();
    },

    minimizeSidebar:function () {
    	var model = this.model;

        model.set("width", $("#sidebar").width());

        var animationDuration = model.get("animationDuration");

        $('#sidebar-toggle').animate({left:"0"}, animationDuration);
        $('#sidebar').animate({width:"0px", marginLeft: "-10px"}, animationDuration);
        $('#sidebar-search-container').css("display", "none");
        $('#sidebar div').animate({opacity:0}, animationDuration);
        var newMainWidth = $(document).width();
        $('#main').animate({width:newMainWidth + "px", "margin-left":"5px"}, animationDuration);
        $('#sidebar-toggle img').attr('src', 'img/tri_arrow_right.png');
    },

    maximizeSidebar:function () {
    	var model = this.model;
    	var animationDuration = model.get("animationDuration");
    	var sidebarWidth = model.get("width");

        $('#sidebar-toggle').animate({left:"350px"}, animationDuration, function () {            
        });

        $('#sidebar').animate({width:sidebarWidth + "px", marginLeft: "0px"}, animationDuration);
        $('#sidebar div').animate({opacity:1}, animationDuration);
        $('#sidebar-toggle img').attr('src', 'img/tri_arrow_left.png');
        var newMainWidth = $(document).width() - sidebarWidth - 10;
        var marginLeft = sidebarWidth + 10;
        $('#main').animate({width:newMainWidth + "px", "margin-left": marginLeft+ "px"}, animationDuration);        
    },

    toggleSidebar:function () {
    	var model = this.model;
    	var isSidebarMaximized = model.get("isSidebarMaximized");

        if (isSidebarMaximized) {
            this.minimizeSidebar();
        }
        else {
            this.maximizeSidebar();
        }

        model.set("isSidebarMaximized", !isSidebarMaximized);
    },

    init:function () {
    	var view = this;

        $('#sidebar-toggle').on("click", function () {
            view.toggleSidebar();
        });

        model.set("width", $('#sidebar').width() + 10);      
    },

    select:function (section) {
    	var currentSection = this.model.get("currentSection");

        $("#sidebar-selectors li").removeClass("active");
        $("#sidebar-selectors-" + section).addClass("active");

        pm.settings.setSetting("activeSidebarSection", section);

        $('#sidebar-section-' + currentSection).css("display", "none");
        $('#' + currentSection + '-options').css("display", "none");

        this.model.set("currentSection", section);        

        $('#sidebar-section-' + section).css("display", "block");
        $('#' + section + '-options').css("display", "block");
    }
});