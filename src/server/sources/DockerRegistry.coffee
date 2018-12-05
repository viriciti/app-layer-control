{ Observable }     = require "rxjs"
{ isEqual, pluck } = require "underscore"
debug              = (require "debug") "app:DockerRegistry"

getRegistryImages = require "../lib/getRegistryImages"
log               = (require "../lib/Logger") "Docker Registry"

module.exports = (config, db) ->
	_getRegistryImages = (cb) ->
		db.AllowedImage.find {}, (error, images) ->
			return cb error if error

			getRegistryImages pluck(images, "name"), cb

	initRegistry$ = (Observable.bindNodeCallback _getRegistryImages)()
	registry$     = Observable
		.timer config.checkingTimeout, config.checkingTimeout
		.mergeMap -> (Observable.bindNodeCallback _getRegistryImages)()
		.distinctUntilChanged (prev, next) ->
			changed = not isEqual prev, next

			if changed
				log.info "Registry changed"
			else
				debug "Registry did not change"

			changed

	initRegistry$
		.concat registry$
		.catch (error, caught) -> Observable.empty()
