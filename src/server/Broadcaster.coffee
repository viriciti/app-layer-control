{ size, map }     = require "lodash"
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
		@broadcast Broadcaster.APPLICATIONS, await @db.Application.find()

	broadcastRegistry: ->
		@broadcast Broadcaster.ALLOWED_IMAGES,  await @db.AllowedImage.find()
		@broadcast Broadcaster.REGISTRY_IMAGES, await @db.RegistryImages.find()

	broadcastGroups: ->
		@broadcast Broadcaster.GROUPS, await @db.Group.find()

	broadcastSources: ->
		@broadcast Broadcaster.SOURCES, await @db.DeviceSource.find()

	broadcastDeviceGroups: (deviceIds) ->
		deviceGroups = await @db.DeviceState.find(deviceId: $in: deviceIds).populate "groups"
		deviceGroups = deviceGroups.reduce (devices, { deviceId, groups }) ->
			devices[deviceId] = groups: groups
			devices
		, {}

		@broadcast Broadcaster.STATE, deviceGroups

module.exports = Broadcaster
