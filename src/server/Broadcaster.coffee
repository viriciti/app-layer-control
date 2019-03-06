{ size }          = require "lodash"
debug             = (require "debug") "app:Broadcaster"
constantCase      = require "constant-case"
{ Map, Iterable } = require "immutable"
Database          = require "./db/Database"

{ isIterable } = Iterable

class Broadcaster
	constructor: (@ws) ->
		@db = new Database autoConnect: true

	broadcast: (type, data) ->
		debug "Broadcasting '#{type}' (#{constantCase type}) to #{size @ws.clients} client(s)"

		@ws.clients.forEach (client) ->
			client.send JSON.stringify
				action: constantCase type
				data:   if isIterable data then data.toJS() else data

	broadcastApplications: ->
		@broadcast "configurations", await @db.Configuration.find()

	broadcastRegistry: ->
		@broadcast "allowedImages",  await @db.AllowedImage.find()
		@broadcast "registryImages", await @db.RegistryImages.find()

	broadcastGroups: ->
		@broadcast "groups", await @db.Group.find()

	broadcastSources: ->
		@broadcast "deviceSources", await @db.DeviceSource.find()

	broadcastDeviceGroups: (deviceIds) ->
		deviceGroups = await @db.DeviceGroup.findByDevices deviceIds
		deviceGroups = deviceGroups.reduce (devices, device) ->
			devices.setIn [device.get("deviceId"), "groups"], device.get "groups"
		, Map()

		@broadcast "devicesState", deviceGroups

module.exports = Broadcaster
