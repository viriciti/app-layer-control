{ size }          = require "lodash"
debug             = (require "debug") "app:Broadcaster"
constantCase      = require "constant-case"
{ Map, Iterable } = require "immutable"
Database          = require "./db/Database"

{ isIterable } = Iterable

class Broadcaster
	@ALLOWED_IMAGES:  "allowedImages"
	@APPLICATIONS:    "configurations"
	@GROUPS:          "groups"
	@LOGS:            "deviceLogs"
	@NS_STATE:        "devicesNsState"
	@REGISTRY_IMAGES: "registryImages"
	@SOURCES:         "deviceSources"
	@STATE:           "devicesState"
	@STATUS:          "devicesStatus"

	constructor: (@ws) ->
		@db = new Database autoConnect: true

	broadcast: (type, data) ->
		debug "Broadcasting '#{type}' (#{constantCase type}) to #{size @ws.clients} client(s)"

		if type.startsWith "@"
			[namespace, type] = type.split "/"
			namespace        += "/"
		else
			namespace = ""

		@ws.clients.forEach (client) ->
			client.send JSON.stringify
				action: [namespace, constantCase type].join ""
				data:   if isIterable data then data.toJS() else data

	broadcastApplications: ->
		@broadcast Broadcaster.APPLICATIONS, await @db.Configuration.find()

	broadcastRegistry: ->
		@broadcast Broadcaster.ALLOWED_IMAGES,  await @db.AllowedImage.find()
		@broadcast Broadcaster.REGISTRY_IMAGES, await @db.RegistryImages.find()

	broadcastGroups: ->
		@broadcast Broadcaster.GROUPS, await @db.Group.find()

	broadcastSources: ->
		@broadcast Broadcaster.SOURCES, await @db.DeviceSource.find()

	broadcastDeviceGroups: (deviceIds) ->
		deviceGroups = await @db.DeviceGroup.findByDevices deviceIds
		deviceGroups = deviceGroups.reduce (devices, device) ->
			devices.setIn [device.get("deviceId"), "groups"], device.get "groups"
		, Map()

		@broadcast Broadcaster.STATE, deviceGroups

module.exports = Broadcaster
