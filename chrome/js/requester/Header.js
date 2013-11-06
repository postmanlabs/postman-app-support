var Header = Backbone.View.extend({
	initialize: function() {
		var donated = pm.settings.getSetting("haveDonated");

		if(donated) {
			$("#donate-link").css("display", "none");
		}
		else {
			$("#donate-link").css("display", "inline-block");
		}

		pm.mediator.on("donatedStatusChanged", function(donated) {
			if(donated) {
				$("#donate-link").css("display", "none");
			}
			else {
				$("#donate-link").css("display", "inline-block");
			}
		});

		$("#add-on-directory").on("click", function() {
			pm.mediator.trigger("openModule", "directory");
			pm.mediator.trigger("initializeDirectory");
		});

		$("#add-on-test-runner").on("click", function() {
			pm.mediator.trigger("openModule", "test_runner");
		});

		$("#logo").on("click", function() {
			pm.mediator.trigger("openModule", "requester");
		});

		$("#back-to-request").on("click", function() {
			pm.mediator.trigger("openModule", "requester");
		});

		pm.mediator.on("openModule", this.onOpenModule, this);

		this.render();
	},

	createSupporterPopover: function() {
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

		$('#donate-link').popover({
		    animation: false,
		    content: supportContent,
		    placement: "bottom",
		    trigger: "manual",
		    html: true,
		    title: "Postman is supported by amazing companies"
		}).on("mouseenter", function () {
		    var _this = this;
		    $(this).popover("show");
		    $(this).siblings(".popover").on("mouseleave", function () {
		        $(_this).popover('hide');
		    });
		}).on("mouseleave", function () {
		    var _this = this;
		    setTimeout(function () {
		        if (!$(".popover:hover").length) {
		            $(_this).popover("hide")
		        }
		    }, 100);
		});
	},

	render: function() {
		this.createSupporterPopover();

		if (pm.features.isFeatureEnabled(FEATURES.DIRECTORY)) {
			$("#add-ons").css("display", "block");
		}
	},

	onOpenModule: function(module) {
		if (module === "directory") {
			$("#add-ons").css("display", "none");
			$("#back-to-requester-container").css("display", "block");
		}
		else if (module === "requester") {
			$("#add-ons").css("display", "block");
			$("#back-to-requester-container").css("display", "none");
		}
	}

});