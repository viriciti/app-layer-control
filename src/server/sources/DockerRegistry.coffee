{ Observable }   = require "rxjs"
{ isEqual, map } = require "lodash"

getRegistryImages = require "../lib/getRegistryImages"

module.exports = (config, db) ->
	fetchRegistryImages = ->
		getRegistryImages map await db.AllowedImage.find(), "name"

	initRegistry$ = Observable.fromPromise fetchRegistryImages()
	registry$     = Observable
		.timer config.checkingTimeout, config.checkingTimeout
		.mergeMap -> Observable.fromPromise fetchRegistryImages()

	initRegistry$
		.concat registry$
		.distinctUntilChanged isEqual
		.catch (error, caught) ->
			Observable.empty()
