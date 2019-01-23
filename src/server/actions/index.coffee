log   = (require "../lib/Logger") "Actions"
_     = require 'underscore'

module.exports = (db, mqttClient, broadcastAction, store) ->
	configurationsActions   = (require "./configurationsActions")   db, mqttClient, store
	registryImagesActions   = (require "./registryImagesActions")   db, mqttClient, store
	groupsActions           = (require "./groupsActions")           db, mqttClient
	deviceSourceActions     = (require "./deviceSourceActions")     db

	actionsMap = _.extend {},
		configurationsActions
		registryImagesActions
		groupsActions
		deviceSourceActions

	execute = ({ action, payload, meta }, cb) ->
		unless actionsMap[action]
			log.error "Action #{action} is not implemented."
			return cb "Action #{action} can't be executed. Check logs."

		# Broadcast the new state of the db to all the sockets
		try
			result = await actionsMap[action] { payload, meta }

			if configurationsActions[action]
				configs = await store.getConfigurations()

				store.cacheConfigurations configs
				broadcastAction "configurations", configs

			else if registryImagesActions[action]
				[registryImages, allowedImages] = await Promise.all [
					store.getRegistryImages()
					store.getAllowedImages()
				]

				store.cacheRegistryImages registryImages
				broadcastAction "registryImages", registryImages.toJS()
				broadcastAction "allowedImages",  allowedImages.toJS()

			else if groupsActions[action]
				groups = await store.getGroups()

				store.cacheGroups groups
				broadcastAction "groups", groups

			else if deviceSourceActions[action]
				deviceSources = await store.getDeviceSources()

				broadcastAction "deviceSources", deviceSources.toJS()

			cb null, result
		catch error
			return cb error

	{ execute }
