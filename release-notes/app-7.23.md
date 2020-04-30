# Postman v7.23.0

Hello! We hope you're staying safe and healthy. Here's what you can find in this Postman release:

### What's New

* This release has an important security update: we're adding PKCE support for the Authorization Code Grant in OAuth 2.0 to help prevent authorization code interception attacks. (Fun fact: apparently, PKCE is pronounced "pixy." The more you know!)
[#3825](https://github.com/postmanlabs/postman-app-support/issues/3825)

### Improvements

* We've made it easier to keep track of your monitoring calls by showing monitoring overages in the "Team" menu, located in the app's header
* We've improved the performance of listing collections in the sidebar. You should see a considerable improvement while working within a workspace with many Collections

### Bug Fixes

* Fixed an issue where clicking on a request from the sidebar would sometimes not open in a tab
[#7399](https://github.com/postmanlabs/postman-app-support/issues/7399)
* Fixed an issue where variable suggestions would cause the app to crash if a variable name was not a string
[#8144](https://github.com/postmanlabs/postman-app-support/issues/8144)
* Fixed an issue where the active theme was not highlighted across multiple Postman windows
[#6262](https://github.com/postmanlabs/postman-app-support/issues/6262)
* Fixed a bug where extra headers would be added when importing a collection that was initially created in the old version of the app
[#5702](https://github.com/postmanlabs/postman-app-support/issues/5702)
* Fixed a bug where `scriptId` remained the same while duplicating a collection/folder/request
[#4802](https://github.com/postmanlabs/postman-app-support/issues/4802)
* Fixed a bug where data storage inconsistencies would prevent the app from opening
* Fixed a bug where you cannot tag a person twice in a comment while editing the comment
* Fixed a bug where the Cancel and Back options were misplaced during login or signup
* Fixed a bug where error icon and close icon would overlap in the key-value editor under the request > headers tab
