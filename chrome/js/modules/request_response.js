var Response = Backbone.Model.extend({
    defaults: function() {
        return {
            status:"",
            responseCode:[],
            time:0,
            headers:[],
            cookies:[],
            mime:"",
            text:"",
            state:{size:"normal"},
            previewType:"parsed"
        };
    }
});

var ResponseBody = Backbone.Model.extend({

});