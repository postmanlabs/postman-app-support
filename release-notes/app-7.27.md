## Postman v7.27.0

Hello! We hope you’re staying safe and healthy. Here’s what you can find in this Postman release:

### What's New
* You can now update collections generated from the API builder and keep your API elements in sync with the API schema
[#6722](https://github.com/postmanlabs/postman-app-support/issues/6722)
* We have added a new overview tab for APIs which consolidates important information about your API
* You can now add APIs to your team's Private API Network from the API overview tab
* You can now easily toggle between the custom size and the default size of a Postman window using the Zoom menu item on macOS
[#7442](https://github.com/postmanlabs/postman-app-support/issues/7442)
* Added support for SHA-256 and SHA-512-256 algorithms in Digest authentication helper
[#5265](https://github.com/postmanlabs/postman-app-support/issues/5265)
* Added support for using custom Authorization header prefix in OAuth 2.0
[#4727](https://github.com/postmanlabs/postman-app-support/issues/4727),
[#6616](https://github.com/postmanlabs/postman-app-support/issues/6616)
* Added support to include AWS auth data in query params
[#3356](https://github.com/postmanlabs/postman-app-support/issues/3356)
* Added callback and verifier fields with body hash support in OAuth 1.0
[#283](https://github.com/postmanlabs/postman-app-support/issues/283),
[#783](https://github.com/postmanlabs/postman-app-support/issues/783),
[#1240](https://github.com/postmanlabs/postman-app-support/issues/1240),
[#2302](https://github.com/postmanlabs/postman-app-support/issues/2302)
* Added the network information for requests in the App

### Improvements
* Remove from Workspace action for Collections and Environments now requires the app to be online
* Removed the dropdown list which appeared on clicking the New button in the App header
* Use faked value instead of schema as fallback when an example is not defined or invalid for OpenAPI importer
* Improve collection-run syncing flow to only load details on-demand


### Bug Fixes
* Added Read-Only mode to view collection and folder level data for users with view permissions only
[#7117](https://github.com/postmanlabs/postman-app-support/issues/7117),
[#8282](https://github.com/postmanlabs/postman-app-support/issues/8282)
* Fixed a bug where the description is displayed as [object Object] while importing collection having a description in { content, type } format
[#7194](https://github.com/postmanlabs/postman-app-support/issues/7194)
* Fixed a bug where schema validation does not provide mismatch details
[#8313](https://github.com/postmanlabs/postman-app-support/issues/8313)
* Fixed a bug where cookies are not previewed when URL is resolved from a variable
[#8348](https://github.com/postmanlabs/postman-app-support/issues/8348)
* Fixed a bug where request name field in edit mode has a smaller width than in view mode
[#8406](https://github.com/postmanlabs/postman-app-support/issues/8406)
* Fixed a bug where variables with null value were being resolved to an empty string in the request body
[#8493](https://github.com/postmanlabs/postman-app-support/issues/8493)
* Fixed a bug where custom CA certificates were not being respected while sending an HTTPS request through proxy
[#8469](https://github.com/postmanlabs/postman-app-support/issues/8469)
* Fixed a bug where Team Usage dropdown would not open from the notification banner
[#8555](https://github.com/postmanlabs/postman-app-support/issues/8555)
* Fixed a bug where importing collection from PostmanCloudAPI loses basic auth values
[#6950](https://github.com/postmanlabs/postman-app-support/issues/6950)
* Fixed a bug when multiple tabs are open, Cmd/Ctrl + Click would open links in responses in a Postman tab instead of the browser
* Fixed a bug where example dropdown shifts to left on selecting an example
* Fixed a bug where UI would break in cases of error in Response
* Fixed an issue where a wrong error message was being shown when creating a mock from collection browser
* Fixed an issue where unwanted scrollbar appeared in mock creation model when creating a private mock from collection browser
