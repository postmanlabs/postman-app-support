var RequestBodyBinaryEditor = Backbone.View.extend({
    initialize: function() {
        this.model.on("startNew", this.onStartNew, this);
        var body = this.model.get("body");        
        var model = this.model;
        var view = this;

        $('#body-data-binary').on('change', function (event) {
            var files = event.target.files;
            console.log(files);
            _.bind(view.readFile, view)(files[0]);            
        });
    },

    onStartNew: function() {
    },

    readFile: function(f) {
        var model = this.model;        
        var reader = new FileReader();
        var view = this;

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                view.binaryData = e.currentTarget.result;                
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsArrayBuffer(f);
    },

    getBinaryBody: function() {
        console.log(this.binaryData);
        return this.binaryData;
    }
});