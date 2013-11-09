var TCPManager = Backbone.View.extend({
	initialize: function() {
		var model = this.model;

		model.on("change", this.render, this);
		pm.mediator.on("showTCPManager", this.show, this);
	},

	render: function() {

	},

	show: function() {
		$("#modal-tcp-manager").modal("show");
	}

});