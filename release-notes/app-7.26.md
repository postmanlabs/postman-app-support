## Postman v7.26.0

Hello! We hope you’re staying safe and healthy. Here’s what you can find in this Postman release:

### What's New
* We’ve added support for an additional language when generating code snippets: You can now generate code snippets for Axios, to use in both the browser and node.js
[#135](https://github.com/postmanlabs/postman-code-generators/issues/135),
[#3822](https://github.com/postmanlabs/postman-app-support/issues/3822)

### Improvements
* Navigating between tabs should be smoother and snappier now that it won’t be impacted by syncing
[#5609](https://github.com/postmanlabs/postman-app-support/issues/5609)
* When managing OAuth 2.0 tokens, you now have the options to delete all or just the expired tokens
[#6115](https://github.com/postmanlabs/postman-app-support/issues/6115)
* When working on a request body, you can now use autocomplete to insert variables more quickly and accurately
[#3517](https://github.com/postmanlabs/postman-app-support/issues/3517)
* When working with Postman variables in a JSON request body, there’s now better support for syntax highlighting and formatting.
* When bringing Postman online, open API tabs will now update without going into a loading state.

### Bug Fixes
* Fixed a bug when generating code where custom headers would go missing
[#8550](https://github.com/postmanlabs/postman-app-support/issues/8550)

* Fixed an issue when starting the Postman snap app on the Wayland environment, where the app wouldn’t open
[#6252](https://github.com/postmanlabs/postman-app-support/issues/6252)

* Fixed a bug when restarting the app, where tab titles for deleted requests would show [CONFLICT] instead of [DELETED]
[#7233](https://github.com/postmanlabs/postman-app-support/issues/7233)

* Fixed a bug when formatting JSON in request body, that would modify long numbers and numbers with decimals.
[#5658](https://github.com/postmanlabs/postman-app-support/issues/5658)

* Fixed a bug when validating JSON syntax where numbers beginning with zero were not highlighted as a validation error
[#7987](https://github.com/postmanlabs/postman-app-support/issues/7987)

* Fixed a bug when editing a JSON file that mistook closed brackets for Postman variables
[#7709](https://github.com/postmanlabs/postman-app-support/issues/7709)

* Fixed a bug in the raw body editor where unclosed `CDATA XML` tags would cause the app to crash
[#6982](https://github.com/postmanlabs/postman-app-support/issues/6982)

* Fixed a bug when working with languages written from right to left, where selecting a portion of the text would return text from the opposite side
[#6493](https://github.com/postmanlabs/postman-app-support/issues/6493)

* Fixed a bug when beautifying JSON in the request body, where it wouldn’t work if there were Postman variables
[#4313](https://github.com/postmanlabs/postman-app-support/issues/4313)

* Fixed a bug when using non-monospace fonts in the text editors where the cursor position was calculated incorrectly
[#2985](https://github.com/postmanlabs/postman-app-support/issues/2985)

* Fixed a bug where checking for updates multiple times would result in an error.
* Fixed a bug when adding a value to an empty environment variable where the new value wouldn’t save.
* Fixed an issue when loading a request in a tab that caused the contents to flicker. 
* Fixed an issue that caused the unsaved changes icon to flicker when the cursor was nearby.
