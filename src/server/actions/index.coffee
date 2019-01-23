log   = (require "../lib/Logger") "Actions"

wrapContainerActions      = require "./configurationsActions"
wrapRegistryImagesActions = require "./registryImagesActions"
wrapGroupsActions         = require "./groupsActions"
wrapDeviceSourceActions   = require "./deviceSourceActions"

module.exports = (db, mqttClient, broadcastAction, store) ->
	({ action, payload, meta }) ->
		configurationsActions   = wrapContainerActions        db, mqttClient, store
		registryImagesActions   = wrapRegistryImagesActions   db, mqttClient, store
		groupsActions           = wrapGroupsActions           db, mqttClient
		deviceSourceActions     = wrapDeviceSourceActions     db

		actionsMap = Object.assign {},
			configurationsActions
			registryImagesActions
			groupsActions
			deviceSourceActions

		unless actionsMap[action]
			log.error "Unable to execute '#{action}': action is not implemented"
			return Promise.reject "Action '#{action}' not implemented"

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

		result
