{ size }     = require "lodash"
debug        = (require "debug") "app:Broadcaster"
constantCase = require "constant-case"

Store = require "./Store"

class Broadcaster
	constructor: (@ws) ->
		@store = new Store

	broadcast: (type, data) ->
		debug "Broadcasting '#{type}' (#{constantCase type}) to #{size @ws.clients} client(s)"

		@ws.clients.forEach (client) ->
			client.send JSON.stringify
				action: constantCase type
				data:   data.toJS()

	broadcastApplications: ->
		@broadcast "configurations", await @store.getConfigurations()

	broadcastRegistry: ->
		@broadcast "allowedImages",  await @store.getAllowedImages()
		@broadcast "registryImages", await @store.getRegistryImages()

	broadcastGroups: ->
		@broadcast "groups", await @store.getGroups()

	broadcastSources: ->
		@broadcast "deviceSources", await @store.getDeviceSources()

	broadcastDeviceGroups: (deviceIds) ->
		deviceGroups = await @store.getDeviceGroups deviceIds
		deviceGroups = deviceGroups.reduce (devices, device) ->
			devices.setIn [device.get("deviceId"), "groups"], device.get "groups"
		, Map()

		@broadcast "devicesBatchState", deviceGroups

module.exports = Broadcaster
