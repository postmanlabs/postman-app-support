Postman
=======
Postman helps you be more efficient while working with APIs. Postman is a scratch-your-own-itch project. The need for it arose while one of the developers was creating an API for his project. After looking around for a number of tools, nothing felt just right. The primary features added were a history of sent requests and collections.
A number of other features have been added since the initial release. A small list is below. To see a fancier page and a video tutorial, check out http://www.getpostman.com

Features
========

Create requests quickly.

- Compact layout
- HTTP requests with file upload support
- Formatted API responses for JSON and XML
- HATEOS support
- Image previews
- Request history
- Basic Auth and OAuth 1.0 helpers
- Autocomplete for URL and header values
- Key/value editors for adding parameters or header values. Works for URL parameters too.
- Use environment variables to easily shift between settings. Great for testing production, staging or local setups.
- Keyboard shortcuts to maximize your productivity

Document and share APIs.

- Use collections to organize requests.
- Document requests inside collections. You can even store entire HTML notes. Postman uses Bootstrap so you can use it too to style your notes.
- Download and share collections with your team of developers.

For more details checkout the Postman wiki - https://github.com/a85/POSTMan-Chrome-Extension/wiki.

Postman for Chrome can be downloaded from https://chrome.google.com/webstore/detail/fdmmgilgnpjigdojojpjoooidkmcomcm

Postman for Google Chrome is licensed under the Apache Licence, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0.html).

Installing the zip file
=========================

If you downloaded the Postman zip file here is what you need to do to install it as a developer extension:

1. Go to Tools > Extensions inside Chrome by clicking on the wrench icon on top right.
2. Select "Load unpacked extension"
3. Select the "chrome" folder with manifest.json in it's root
4. Postman will be installed as a developer extension. The installation from the Chrome Web Store will remain independent with all your data.

Building and Developing
=========================
1. Install the dependencies
<pre>
    sudo npm install -g grunt grunt-handlebars grunt-contrib-handlebars
</pre>
2. Generate the template.js
<pre>
	rm -f  chrome/js/requester.* chrome/js/templates.js && grunt handlebars && grunt --force
</pre>
3. Interesting folders to modify:
<pre>
    mate chrome/index.html chrome/js/modules chrome/js/templates chrome/css
<pre>
4. The following command will continuously build while chrome/js/modules and chrome/js/templates are being modified:
<pre>
    grunt watch
<pre>
5. For misc. grunt tasks, look at grunt.js.