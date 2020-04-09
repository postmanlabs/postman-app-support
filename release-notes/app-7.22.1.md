# Postman v7.22.1

Hello. We hope you’re safe and well. There’s a lot going on right now, so we really appreciate you taking the time to read about what we’ve we released to make working with APIs easier.

Get the latest version of the app here: https://www.postman.com/downloads/

### What’s new
* We’re really excited to announce that Postman now supports writing RAML 1.0-type APIs. This new version brings a lot of new improvements including support for declaring Data Types, Libraries and Annotations, while also enhancing the way security schemas are written.
* See who’s in your workspace with new avatars next to the workspace menu. For workspaces with more than 3 users, click on the number next to the avatars for a full list of workspace members and to see who’s currently active. [Learn more](https://go.pstmn.io/docs-presence).
* Take a tour of the API Builder to learn how Postman can help you design, develop and manage your API throughout its lifecycle.

### Improvements
* Working with GraphQL in Postman just got a lot easier now that there’s support for writing GraphQL schemas in JSON
[#6719](https://github.com/postmanlabs/postman-app-support/issues/6719).
* On top of that, you can now directly import a GraphQL schema as an API
[#6719](https://github.com/postmanlabs/postman-app-support/issues/6719).
* If you want to suggest changes to a collection but you’re only a Viewer, you can now fork the collection, make your changes and create a pull request to have them reviewed.
* We moved the “Use Token” button to the top of the OAuth 2.0 “Manage Access Tokens” screen, so you won’t have to scroll in order to find it. We also found and fixed a related issue where the “Get New Access Token” screen would overflow, hiding buttons and form fields
[#8067](https://github.com/postmanlabs/postman-app-support/issues/8067).
* The tooltips for the response’s status, time and size were a bit temperamental. Now they won’t disappear the instant you move your cursor.
* Performance improvements for:
* Typing a URL when there are a lot of autocomplete suggestions [#5990](https://github.com/postmanlabs/postman-app-support/issues/5990)
* Opening a new tab when multiple tabs are already open
* Downloading and saving large responses [#7871](https://github.com/postmanlabs/postman-app-support/issues/7871)
* The environment quicklook menu

### Bug Fixes
* Clarified the “Don’t ask me again” checkbox on the warning message that pops up when you close a tab without saving the changes. Now it asks you to check the box if you don’t want to be reminded to save your changes when closing a tab
[#7929](https://github.com/postmanlabs/postman-app-support/issues/7929).
* Fixed an issue where using the keyboard shortcut to toggle the two-pane view wouldn’t update the settings
[#7212](https://github.com/postmanlabs/postman-app-support/issues/7212).
* Fixed a bug where the environment quicklook menu was hidden by the left sidebar for resolutions less than 1280x1024
[#7976](https://github.com/postmanlabs/postman-app-support/issues/7976).
* Fixed a bug in the data editor where selecting text inside a cell would select the row instead
[#5078](https://github.com/postmanlabs/postman-app-support/issues/5078).
* Fixed an issue where some types of path variables from OpenAPI schemas weren’t imported correctly
[#133](https://github.com/postmanlabs/postman-app-support/issues/133).
* Fixed an issue where the app would sometimes freeze while importing Swagger or OpenAPI schemas containing circular references
[#7844](https://github.com/postmanlabs/postman-app-support/issues/7844).
* Fixed an issue where instances of --data-raw in a cURL file wouldn’t import
[#7895](https://github.com/postmanlabs/postman-app-support/issues/7895).
* Fixed an issue where some instances of -X present in a cURL request were parsed incorrectly
[#7806](https://github.com/postmanlabs/postman-app-support/issues/7806).
* Fixed a bug in the request builder where having a form-data with lots of key/value pairs would break the navigation
[#8029](https://github.com/postmanlabs/postman-app-support/issues/8029).
* Fixed a bug where OAuth1 was failing for requests with disabled URL-encoded params
[#7522](https://github.com/postmanlabs/postman-app-support/issues/7522).
* Fixed an issue where headers were missing in examples generated from OpenAPI specs.
* Fixed a bug where shared collections weren’t marked with the shared icon.
* Fixed a bug in comments where a user couldn’t tag other users more than once.
* Fixed a bug in workspaces where the edit workspace screen had old data about non-active workspace.
* Fixed an issue related to variables where long variable names would cause the context tooltip to display incorrectly.
