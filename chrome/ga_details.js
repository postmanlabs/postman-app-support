//TODO - Remove the 3 lines below
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-26564585-4']);
_gaq.push(['_trackPageview']);

var service = analytics.getService('Postman - REST Client (Packaged app)');
var tracker = service.getTracker('UA-43979731-6');
// TODO - add permission for tracking users.
tracker.sendAppView('MainView');
