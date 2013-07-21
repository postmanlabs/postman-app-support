// TODO This will be defined as the global app view
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
    }
};