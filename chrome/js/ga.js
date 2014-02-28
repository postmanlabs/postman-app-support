var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-26564585-1']);
_gaq.push(['_trackPageview']);

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

//CPA - Testing
var service = analytics.getService('Postman - REST Client');
var tracker = service.getTracker('UA-43979731-5');
// TODO - add permission for tracking users.
tracker.sendAppView('MainView');

