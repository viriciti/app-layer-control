{ Observable }                  = require "rxjs"
{ map, reduce, chain, isEqual } = require "underscore"
semver                          = require "semver"
debug                           = (require "debug") "app:docker-registry"

Versioning = require "../lib/Versioning"
log        = (require "../lib/Logger") "Docker Registry"

module.exports = (config, db) ->
	versioning = new Versioning config

	_getRegistryImages = (cb) ->
		db.AllowedImage.find {}, (error, images) ->
			return cb error if error
			images = map images, (i) -> i.name

			versioning.getImages images, (error, result) ->
				return cb error if error

				cb null, reduce result, (memo, { versions, access, exists }, imageName) ->
					versions = chain versions
						.without "latest", "1"
						.filter semver.valid
						.sort semver.compare
						.value()

					memo["#{config.docker.host}/#{imageName}"] = { versions, access, exists }
					memo
				, {}


	initRegistry$ = (Observable.bindNodeCallback _getRegistryImages)()

	registry$ = Observable
		.timer config.checkingTimeout, config.checkingTimeout
		.mergeMap -> (Observable.bindNodeCallback _getRegistryImages)()
		.distinctUntilChanged (prev, next) ->
			changed = not isEqual prev, next

			if changed
				debug "Registry did not change"
			else
				log.info "Registry changed"

			changed

	initRegistry$
		.concat registry$
		.catch (error, caught) -> Observable.empty()
