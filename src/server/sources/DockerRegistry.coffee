{ Observable }   = require "rxjs"
{ isEqual, map } = require "lodash"

getRegistryImages = require "../lib/getRegistryImages"

module.exports = (config, db) ->
	_getRegistryImages = (cb) ->
		images = await db.AllowedImage.find {}
		images = await getRegistryImages map images, "name"

		cb null, images

	initRegistry$ = (Observable.bindNodeCallback _getRegistryImages)()
	registry$     = Observable
		.timer config.checkingTimeout, config.checkingTimeout
		.mergeMap -> (Observable.bindNodeCallback _getRegistryImages)()

	initRegistry$
		.concat registry$
		.distinctUntilChanged isEqual
		.catch (error, caught) ->
			Observable.empty()
