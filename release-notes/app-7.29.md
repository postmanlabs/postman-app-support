## Postman v7.29.0

Here’s what you can find in this Postman release:

* When writing pre-request and test scripts, global pm.* functions, Node.js, and other Node modules from the Postman Sandbox will now appear in the autocomplete menu.
* When authoring requests, you can now insert an `$isoTimestamp` variable from our library of dynamic variables.
* You can now automatically validate your OpenAPI 3.0 specification while importing or editing it. 

### Improvements

* A collection or environment that exists only in a single workspace, cannot be removed, but only deleted or shared
[#4509](https://github.com/postmanlabs/postman-app-support/issues/4509)
* When using the workspace switcher, you can now use your keyboard’s arrow keys to navigate between the menu options.
* When importing an OpenAPI specification, there is now support for parameter serialization.

### Bug Fixes

* Fixed a bug where after sending a request and opening a new tab, the tab for the previous request would be replaced by the new request tab
[#6992](https://github.com/postmanlabs/postman-app-support/issues/6992)
* Fixed a bug where duplicating a collection, folder, request, or environment twice would give the same name to the duplicated entities
[#8012](https://github.com/postmanlabs/postman-app-support/issues/8012)
* Fixed a bug where examples response pane was not visible for small window height
[#8797](https://github.com/postmanlabs/postman-app-support/issues/8797)
* Fixed error state in share entity modal when the entity is not synced or deleted
[#8676](https://github.com/postmanlabs/postman-app-support/issues/8676)
* Fixed a bug when sharing an API element where zooming in would hide the action buttons
[#8691](https://github.com/postmanlabs/postman-app-support/issues/8691)
* Fixed a bug where after leaving a private team workspace, the workspace switcher would remain in a loading state.
