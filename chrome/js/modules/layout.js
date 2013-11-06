pm.layout = {
    isModalOpen:false,
    activeModal: "",

    socialButtons:{
        "facebook":'<iframe src="http://www.facebook.com/plugins/like.php?href=https%3A%2F%2Fchrome.google.com%2Fwebstore%2Fdetail%2Ffdmmgilgnpjigdojojpjoooidkmcomcm&amp;send=false&amp;layout=button_count&amp;width=250&amp;show_faces=true&amp;action=like&amp;colorscheme=light&amp;font&amp;height=21&amp;appId=26438002524" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:250px; height:21px;" allowTransparency="true"></iframe>',
        "twitter":'<a href="https://twitter.com/share" class="twitter-share-button" data-url="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm" data-text="I am using Postman to super-charge REST API testing and development!" data-count="horizontal" data-via="postmanclient">Tweet</a><script type="text/javascript" src="https://platform.twitter.com/widgets.js"></script>',
        "plusOne":'<script type="text/javascript" src="https://apis.google.com/js/plusone.js"></script><g:plusone size="medium" href="https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm"></g:plusone>'
    },

    detectLauncher: function() {
        if(pm.debug) {
            return;
        }

        var launcherNotificationCount = pm.settings.get("launcherNotificationCount");
        var maxCount = 1;
        if(launcherNotificationCount >= 1) {
            return true;
        }

        var extension_id = "igofndmniooofoabmmpfonmdnhgchoka";
        var extension_url = "https://chrome.google.com/webstore/detail/" + extension_id;

        noty(
        {
            type:'information',
            text:"Click here to get the Postman Launcher for quick access to Postman from the Chrome toolbar",
            layout:'topRight',
            callback: {
                onClose: function() {
                    var url = "https://chrome.google.com/webstore/detail/postman-launcher/igofndmniooofoabmmpfonmdnhgchoka";
                    window.open(url, '_blank');
                    window.focus();
                }
            }
        });

        var launcherNotificationCount = parseInt(pm.settings.get("launcherNotificationCount")) + 1;
        pm.settings.set("launcherNotificationCount", launcherNotificationCount);
    },

    init:function () {
        pm.layout.detectLauncher()

        if (pm.settings.get("haveDonated") == true) {
            console.log("Donated");
            pm.layout.hideDonationBar();
        }

        $('#make-postman-better').on("click", function () {
            $('#modal-spread-the-word').modal('show');
            pm.layout.attachSocialButtons();
        });

        $('#donate').on("click", function () {
            $('#donate-form form').submit();
        });

        $('#download-all-data').on("click", function() {
            pm.indexedDB.downloadAllData(function() {
                ga('send', 'event', 'data', 'download');
                console.log("Downloaded all data");
            });
        });

        $('#postman-wiki').on("click", function() {
            ga('send', 'event', 'wiki', 'view');
        });

        $('#upgrade').on("click", function() {
            ga('send', 'event', 'upgrade', 'click');
        });

        var supportContent = "<div class='supporters'><div class='supporter clearfix'>";
        supportContent += "<div class='supporter-image supporter-image-mashape'>";
        supportContent += "<a href='http://www.getpostman.com/r?url=https://www.mashape.com/?utm_source=chrome%26utm_medium=app%26utm_campaign=postman' target='_blank'>";
        supportContent += "<img src='img/supporters/mashape.png'/></a></div>";
        supportContent += "<div class='supporter-tag'>Consume or provide cloud services with the Mashape API Platform.</div></div>";
        supportContent += "<div class='supporter clearfix'>";
        supportContent += "<div class='supporter-image'>";
        supportContent += "<a href='http://www.getpostman.com/donate' target='_blank' class='donate-popover-link'>";
        supportContent += "Donate</a></div>";
        supportContent += "<div class='supporter-tag'>If you like Postman help support the project!</div>";
        supportContent += "</div></div>";


        $('#donate').popover({
            animation: false,
            content: supportContent,
            placement: "top",
            trigger: "manual",
            html: true,
            title: "Postman is supported by some amazing companies"
        }).on("mouseenter", function () {
            var _this = this;
            //hover event here - number of times ad is seen
            ga('send', 'event', 'sponsors', 'view');
            $(this).popover("show");
            $(this).siblings(".popover").on("mouseleave", function () {
                $(_this).popover('hide');
            });
        }).on("mouseleave", function () {
            var _this = this;
            setTimeout(function () {
                if (!$(".popover:hover").length) {
                    $(_this).popover("hide");
                }
            }, 100);
        });

        $('#response-body-toggle').on("click", function () {
            pm.request.response.toggleBodySize();
        });

        $('#response-body-line-wrapping').on("click", function () {
            pm.editor.toggleLineWrapping();
            return true;
        });

        $('#response-open-in-new-window').on("click", function () {
            var data = pm.request.response.text;
            pm.request.response.openInNewWindow(data);
        });


        $('#response-formatting').on("click", "a", function () {
            var previewType = $(this).attr('data-type');
            pm.request.response.changePreviewType(previewType);
        });

        $('#response-language').on("click", "a", function () {
            var language = $(this).attr("data-mode");
            pm.request.response.setMode(language);
        });

        $('#response-sample-save-start').on("click", function () {
            $('#response-sample-save-start-container').css("display", "none");
            $('#response-sample-save-form').css("display", "inline-block");
        });

        $('#response-sample-cancel').on("click", function () {
            $('#response-sample-save-start-container').css("display", "inline-block");
            $('#response-sample-save-form').css("display", "none");
        });

        $('#response-sample-save').on("click", function () {
            var url = $('#url').val();

            var currentResponse = pm.request.response;
            var request = new CollectionRequest();
            request.id = guid();
            request.headers = pm.request.getPackedHeaders();
            request.url = url;
            request.method = pm.request.method;
            request.data = pm.request.body.getData();
            request.dataMode = pm.request.dataMode;
            request.time = new Date().getTime();

            var name = $("#response-sample-name").val();

            var response = {
                "id":guid(),
                "name":name,
                "collectionRequestId":pm.request.collectionRequestId,
                "request":request,
                "responseCode":currentResponse.responseCode,
                "time":currentResponse.time,
                "headers":currentResponse.headers,
                "cookies":currentResponse.cookies,
                "text":currentResponse.text
            };

            pm.collections.saveResponseAsSample(response);

            $('#response-sample-save-start-container').css("display", "inline-block");
            $('#response-sample-save-form').css("display", "none");
        });

        this.sidebar.init();

        pm.request.response.clear();

        $('#sidebar-selectors li a').click(function () {
            var id = $(this).attr('data-id');
            pm.layout.sidebar.select(id);
        });

        $('a[rel="tooltip"]').tooltip();
        $('input[rel="popover"]').popover();

        $('#form-add-to-collection').submit(function () {
            pm.collections.addRequestToCollection();
            $('#modal-add-to-collection').modal('hide');
            return false;
        });

        $('#modal-add-to-collection .btn-primary').click(function () {
            pm.collections.addRequestToCollection();
            $('#modal-add-to-collection').modal('hide');
        });

        $('#form-new-collection').submit(function () {
            pm.collections.addCollection();
            return false;
        });

        $('#form-edit-collection').submit(function() {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();
            pm.collections.updateCollection(id, name);
            $('#modal-edit-collection').modal('hide');
            return false;
        });

        $('#form-edit-collection-request').submit(function() {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();
            pm.collections.updateCollectionRequestMeta(id, name, description);
            return false;
        });

        $('#modal-new-collection .btn-primary').click(function () {
            pm.collections.addCollection();
            return false;
        });

        $('#modal-edit-collection .btn-primary').click(function () {
            var id = $('#form-edit-collection .collection-id').val();
            var name = $('#form-edit-collection .collection-name').val();

            pm.collections.updateCollectionMeta(id, name);
            $('#modal-edit-collection').modal('hide');
        });

        $('#modal-edit-collection-request .btn-primary').click(function () {
            var id = $('#form-edit-collection-request .collection-request-id').val();
            var name = $('#form-edit-collection-request .collection-request-name').val();
            var description = $('#form-edit-collection-request .collection-request-description').val();
            pm.collections.updateCollectionRequestMeta(id, name, description);
        });

        $(window).resize(function () {
            pm.layout.setLayout();
        });

        $('#response-data').on("mousedown", ".cm-link", function () {
            var link = $(this).html();
            var headers = $('#headers-keyvaleditor').keyvalueeditor('getValues');
            pm.request.loadRequestFromLink(link, headers);
        });

        $('.response-tabs').on("click", "li", function () {
            var section = $(this).attr('data-section');
            if (section === "body") {
                pm.request.response.showBody();
            }
            else if (section === "headers") {
                pm.request.response.showHeaders();
            }
            else if (section === "cookies") {
                pm.request.response.showCookies();
            }
        });

        $('#request-meta').on("mouseenter", function () {
            $('.request-meta-actions').css("display", "block");
        });

        $('#request-meta').on("mouseleave", function () {
            $('.request-meta-actions').css("display", "none");
        });

        this.attachModalHandlers();
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

    attachModalHandlers:function () {
        $("#modal-new-collection").on("shown", function () {
            $("#new-collection-blank").focus();
            pm.layout.onModalOpen("#modal-new-collection");
        });

        $("#modal-new-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-edit-collection").on("shown", function () {
            $("#modal-edit-collection .collection-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection");
        });

        $("#modal-edit-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-edit-collection-request").on("shown", function () {
            $("#modal-edit-collection-request .collection-request-name").focus();
            pm.layout.onModalOpen("#modal-edit-collection-request");
        });

        $("#modal-edit-collection-request").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-add-to-collection").on("shown", function () {
            $("#select-collection").focus();
            pm.layout.onModalOpen("#modal-add-to-collection");
        });

        $("#modal-add-to-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-share-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-share-collection");
        });

        $("#modal-share-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-import-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-import-collection");
        });

        $("#modal-import-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-delete-collection").on("shown", function () {
            pm.layout.onModalOpen("#modal-delete-collection");
        });

        $("#modal-delete-collection").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-environments").on("shown", function () {
            $('.environments-actions-add').focus();
            pm.layout.onModalOpen("#modal-environments");
        });

        $("#modal-environments").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-header-presets").on("shown", function () {
            $(".header-presets-actions-add").focus();
            pm.layout.onModalOpen("#modal-header-presets");
        });

        $("#modal-header-presets").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-settings").on("shown", function () {
            $("#history-count").focus();
            pm.layout.onModalOpen("#modal-settings");
        });

        $("#modal-settings").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-spread-the-word").on("shown", function () {
            pm.layout.onModalOpen("#modal-spread-the-word");
        });

        $("#modal-spread-the-word").on("hidden", function () {
            pm.layout.onModalClose();
        });

        $("#modal-shortcuts").on("shown", function () {
            pm.layout.onModalOpen("#modal-shortcuts");
        });

        $("#modal-shortcuts").on("hidden", function () {
            pm.layout.onModalClose();
        });
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
        this.refreshScrollPanes();
    },

    refreshScrollPanes:function () {
        var newMainWidth = $('#container').width() - $('#sidebar').width();
        $('#main').width(newMainWidth + "px");

        if ($('#sidebar').width() > 100) {
            $('#sidebar').jScrollPane({
                mouseWheelSpeed:24
            });
        }
    },

    hideDonationBar: function () {
        $("#sidebar-footer").css("display", "none");
    },

    sidebar:{
        currentSection:"history",
        isSidebarMaximized:true,
        sections:[ "history", "collections" ],
        width:0,
        animationDuration:250,

        minimizeSidebar:function () {
            var animationDuration = pm.layout.sidebar.animationDuration;
            $('#sidebar-toggle').animate({left:"0"}, animationDuration);
            $('#sidebar').animate({width:"5px"}, animationDuration);
            $('#sidebar-footer').css("display", "none");
            $('#sidebar div').animate({opacity:0}, animationDuration);
            var newMainWidth = $(document).width() - 5;
            $('#main').animate({width:newMainWidth + "px", "margin-left":"5px"}, animationDuration);
            $('#sidebar-toggle img').attr('src', 'img/tri_arrow_right.png');
        },

        maximizeSidebar:function () {
            var animationDuration = pm.layout.sidebar.animationDuration;
            $('#sidebar-toggle').animate({left:"350px"}, animationDuration, function () {
                $('#sidebar-footer').fadeIn();
            });
            $('#sidebar').animate({width:pm.layout.sidebar.width + "px"}, animationDuration);
            $('#sidebar div').animate({opacity:1}, animationDuration);
            $('#sidebar-toggle img').attr('src', 'img/tri_arrow_left.png');
            var newMainWidth = $(document).width() - pm.layout.sidebar.width;
            $('#main').animate({width:newMainWidth + "px", "margin-left":pm.layout.sidebar.width + "px"}, animationDuration);
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
            $('#history-items').on("click", ".request-actions-delete", function () {
                var request_id = $(this).attr('data-request-id');
                pm.history.deleteRequest(request_id);
            });

            $('#history-items').on("click", ".request", function () {
                var request_id = $(this).attr('data-request-id');
                pm.history.loadRequest(request_id);
            });

            $('#sidebar-toggle').on("click", function () {
                pm.layout.sidebar.toggleSidebar();
            });

            pm.layout.sidebar.width = $('#sidebar').width() + 10;

            this.addRequestListeners();
        },

        select:function (section) {
            if (pm.collections.areLoaded === false) {
                pm.collections.getAllCollections();
            }

            $('#sidebar-section-' + this.currentSection).css("display", "none");
            $('#' + this.currentSection + '-options').css("display", "none");

            this.currentSection = section;

            $('#sidebar-section-' + section).fadeIn();
            $('#' + section + '-options').css("display", "block");
            pm.layout.refreshScrollPanes();
            return true;
        },

        addRequest:function (url, method, id, position) {
            if (url.length > 80) {
                url = url.substring(0, 80) + "...";
            }
            url = limitStringLineWidth(url, 40);

            var request = {
                url:url,
                method:method,
                id:id,
                position:position
            };

            if (position === 'top') {
                $('#history-items').prepend(Handlebars.templates.item_history_sidebar_request(request));
            }
            else {
                $('#history-items').append(Handlebars.templates.item_history_sidebar_request(request));
            }

            $('#sidebar-section-history .empty-message').css("display", "none");
            pm.layout.refreshScrollPanes();
        },

        addRequestListeners:function () {
            $('#sidebar-sections').on("mouseenter", ".sidebar-request", function () {
                var actionsEl = jQuery('.request-actions', this);
                actionsEl.css('display', 'block');
            });

            $('#sidebar-sections').on("mouseleave", ".sidebar-request", function () {
                var actionsEl = jQuery('.request-actions', this);
                actionsEl.css('display', 'none');
            });
        },

        emptyCollectionInSidebar:function (id) {
            $('#collection-requests-' + id).html("");
        },

        removeRequestFromHistory:function (id, toAnimate) {
            if (toAnimate) {
                $('#sidebar-request-' + id).slideUp(100);
            }
            else {
                $('#sidebar-request-' + id).remove();
            }

            if (pm.history.requests.length === 0) {
                pm.history.showEmptyMessage();
            }
            else {
                pm.history.hideEmptyMessage();
            }

            pm.layout.refreshScrollPanes();
        },

        removeCollection:function (id) {
            $('#collection-' + id).remove();
            pm.layout.refreshScrollPanes();
        }
    }
};