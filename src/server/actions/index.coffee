log   = (require "../lib/Logger") "Actions"
_     = require "underscore"
async = require "async"

module.exports = (db, mqttSocket, broadcastAction, store) ->
	configurationsActions   = (require "./configurationsActions")   db, mqttSocket, store
	registryImagesActions   = (require "./registryImagesActions")   db, mqttSocket
	groupsActions           = (require "./groupsActions")           db, mqttSocket
	deviceSourceActions     = (require "./deviceSourceActions")     db
	allowedImagesActions    = (require "./allowedImageActions")     db

	actionsMap = _.extend {},
		configurationsActions
		registryImagesActions
		groupsActions
		deviceSourceActions
		allowedImagesActions

	execute = ({ action, payload, meta }, cb) ->
		unless actionsMap[action]
			log.error "Action #{action} is not implemented."
			return cb "Action #{action} can't be executed. Check logs."

		# Broadcast the new state of the db to all the sockets
		actionsMap[action] { payload, meta }, (error, result) ->
			if error
				log.error error
				return cb error

			if configurationsActions[action]
				store.getConfigurations (error, configs) ->
					return log.error error.message if error

					store.cacheConfigurations configs

					broadcastAction "configurations", configs

			else if registryImagesActions[action]
				async.parallel
					registryImages:        store.getRegistryImages
					allowedImages:         store.getAllowedImages
				, (error, { registryImages, allowedImages } = {}) ->
					return log.error error.message if error

					store.cacheRegistryImages registryImages

					broadcastAction "registryImages", registryImages.toJS()
					broadcastAction "allowedImages",  allowedImages.toJS()

			else if groupsActions[action]
				store.getGroups (error, groups) ->
					return log.error error.message if error

					store.cacheGroups groups

					broadcastAction "groups", groups

			else if deviceSourceActions[action]
				store.getDeviceSources (error, deviceSources) ->
					return log.error error.message if error

					broadcastAction "deviceSources", deviceSources.toJS()

			else if allowedImagesActions[action]
				store.getAllowedImages (error, allowedImages) ->
					return log.error error.message if error

					broadcastAction "allowedImages", allowedImages.toJS()

			cb null, result

	{ execute }
