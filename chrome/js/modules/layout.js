pm.layout = {
    isModalOpen:false,
    activeModal: "",

    socialButtons:{
        "facebook":'<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Ffdmmgilgnpjigdojojpjoooidkmcomcm&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;appId=26438002524" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>',
        "twitter":'<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm" data-text="I am using Postman to super-charge REST API testing and development!" data-count="horizontal" data-via="postmanclient">Tweet</a><script type="text/javascript" src="https://platform.twitter.com/widgets.js"></script>'
    },

    init:function () {
        if (pm.settings.get("haveDonated") === true) {
            pm.layout.hideDonationBar();
        }

        $('#make-postman-better').on("click", function () {
            $('#modal-spread-the-word').modal('show');
            //pm.layout.attachSocialButtons();
        });

        $('#donate').on("click", function () {
            $('#donate-form form').submit();
        });

        $('#donate').popover({
            animation: true,
            content: "Please donate $5 only if you like Postman! This will help a lot in the development and maintenance of the project.",
            placement: "top",
            trigger: "hover",
            title: "Donate"
        });

        $('a[rel="tooltip"]').tooltip();

        this.sidebar.init();

        //TODO Move this to ResponseEditor
        //pm.request.response.clear();

        $('#sidebar-selectors li').click(function () {
            var id = $(this).attr('data-id');
            pm.layout.sidebar.select(id);
        });

        $('a[rel="tooltip"]').tooltip();
        $('input[rel="popover"]').popover();

        var resizeTimeout;

        $(window).on("resize", function () {
            console.log("Resize called");
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                console.log("Set layout");
                pm.layout.setLayout();
            }, 500);
        });

        this.setLayout();
    },

    onModalOpen:function (activeModal) {
        pm.layout.activeModal = activeModal;
        pm.layout.isModalOpen = true;
    },

    onModalClose:function () {
        pm.layout.activeModal = "";
        pm.layout.isModalOpen = false;
    },

    attachSocialButtons:function () {
        var currentContent = $("#about-postman-twitter-button").html();
        if (currentContent === "" || !currentContent) {
            $('#about-postman-twitter-button').html(this.socialButtons.twitter);
        }

        currentContent = $("#about-postman-plus-one-button").html();
        if (currentContent === "" || !currentContent) {
            $("#about-postman-plus-one-button").html(this.socialButtons.plusOne);
        }

        currentContent = $('#about-postman-facebook-button').html();
        if (currentContent === "" || !currentContent) {
            $("#about-postman-facebook-button").html(this.socialButtons.facebook);
        }
    },

    setLayout:function () {
        pm.layout.refreshScrollPanes();
    },

    refreshScrollPanes:function () {
        var newMainWidth = $('#container').width() - $('#sidebar').width() - 10;
        var newMainHeight = $(document).height() - 55;
        $('#main').width(newMainWidth + "px");
        $('#main').height(newMainHeight + "px");
    },

    hideDonationBar: function () {
        $("#header-donate-link-container").css("display", "none");
    },

    showDonationBar: function() {
        $("#header-donate-link-container").css("display", "block");
    },

    sidebar:{
        currentSection:"history",
        isSidebarMaximized:true,
        sections:[ "history", "collections" ],
        width:0,
        animationDuration:250,

        minimizeSidebar:function () {
            pm.layout.sidebar.width = $("#sidebar").width();

            var animationDuration = pm.layout.sidebar.animationDuration;
            $('#sidebar-toggle').animate({left:"0"}, animationDuration);
            $('#sidebar').animate({width:"0px", marginLeft: "-10px"}, animationDuration);
            $('#sidebar-search-container').css("display", "none");
            $('#sidebar div').animate({opacity:0}, animationDuration);
            var newMainWidth = $(document).width();
            $('#main').animate({width:newMainWidth + "px", "margin-left":"5px"}, animationDuration);
            $('#sidebar-toggle img').attr('src', 'img/tri_arrow_right.png');
        },

        maximizeSidebar:function () {
            var animationDuration = pm.layout.sidebar.animationDuration;
            $('#sidebar-toggle').animate({left:"350px"}, animationDuration, function () {
                if (pm.settings.getSetting("haveDonated") === false) {
                    $('#sidebar-search-container').fadeIn();
                }

            });

            $('#sidebar').animate({width:pm.layout.sidebar.width + "px", marginLeft: "0px"}, animationDuration);
            $('#sidebar div').animate({opacity:1}, animationDuration);
            $('#sidebar-toggle img').attr('src', 'img/tri_arrow_left.png');
            var newMainWidth = $(document).width() - pm.layout.sidebar.width - 10;
            var marginLeft = pm.layout.sidebar.width + 10;
            $('#main').animate({width:newMainWidth + "px", "margin-left": marginLeft+ "px"}, animationDuration);
            pm.layout.refreshScrollPanes();
        },

        toggleSidebar:function () {
            var isSidebarMaximized = pm.layout.sidebar.isSidebarMaximized;
            if (isSidebarMaximized) {
                pm.layout.sidebar.minimizeSidebar();
            }
            else {
                pm.layout.sidebar.maximizeSidebar();
            }

            pm.layout.sidebar.isSidebarMaximized = !isSidebarMaximized;
        },

        init:function () {
            $('#sidebar-toggle').on("click", function () {
                pm.layout.sidebar.toggleSidebar();
            });

            pm.layout.sidebar.width = $('#sidebar').width() + 10;
        },

        select:function (section) {
            $("#sidebar-selectors li").removeClass("active");
            $("#sidebar-selectors-" + section).addClass("active");

            pm.settings.setSetting("activeSidebarSection", section);

            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }

            $('#sidebar-section-' + this.currentSection).css("display", "none");
            $('#' + this.currentSection + '-options').css("display", "none");

            this.currentSection = section;

            $('#sidebar-section-' + section).css("display", "block");
            $('#' + section + '-options').css("display", "block");
            pm.layout.refreshScrollPanes();
            return true;
        }
    }
};