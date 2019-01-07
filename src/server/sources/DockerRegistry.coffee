{ Observable }     = require "rxjs"
{ isEqual, pluck } = require 'underscore'

getRegistryImages = require "../lib/getRegistryImages"

module.exports = (config, db) ->
	_getRegistryImages = (cb) ->
		db.AllowedImage.find {}, (error, images) ->
			return cb error if error

			getRegistryImages pluck(images, "name"), cb

	initRegistry$ = (Observable.bindNodeCallback _getRegistryImages)()
	registry$     = Observable
		.timer config.checkingTimeout, config.checkingTimeout
		.mergeMap -> (Observable.bindNodeCallback _getRegistryImages)()

	initRegistry$
		.concat registry$
		.distinctUntilChanged isEqual
		.catch (error, caught) -> Observable.empty()
