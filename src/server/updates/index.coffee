mqtt                            = require "mqtt"
{ Map }                         = require "immutable"
{ isBoolean, throttle, random } = require "lodash"
config                          = require "config"
MQTTPattern                     = require "mqtt-pattern"

log = (require "../lib/Logger") "updates"

updateGroups = ({ db, store }) ->
	groups = await store.getGroups()

	if groups.every (applications) -> Map.isMap applications
		log.warn "→ No need to update groups"
		return Promise.resolve()
	else
		log.info "→ Updating groups to new format ..."

	[enabledRegistryImages, configurations] = await Promise.all [
		store.getEnabledRegistryImages()
		store.getConfigurations()
	]

	Promise.all groups.map (group) ->
		[name, applications] = group
		updatedApplications  = applications.reduce (newApplications, applicationName) ->
			fromImage      = configurations.getIn [applicationName, "fromImage"]
			enabledVersion = enabledRegistryImages.get fromImage

			if enabledVersion
				log.info "Setting version for #{applicationName} to #{enabledVersion}"
			else
				log.warn "No enabled version for #{applicationName} (#{fromImage})"

			newApplications.set applicationName, enabledVersion
		, Map()

		updateQuery        = label: name
		updatePayload      = applications: updatedApplications.toJS()
		updateOptions      = upsert: true
		updatePayloadUnset = $unset: enabledVersion: ""

		Promise.all [
			db.Group.findOneAndUpdate updateQuery, updatePayload, updateOptions
			db.RegistryImages.update {}, updatePayloadUnset
		]

updateExists = ({ db, store }) ->
	images = await store.getRegistryImages()

	isUpdated = images.every (image) ->
		isBoolean image.get "access"

	if isUpdated
		log.warn "→ No need to update registry images"
		return Promise.resolve()
	else
		log.info "→ Updating registry images ..."

	Promise.all images.map ([name, image]) ->
		updateQuery   = { name }
		updatePayload = access: image.get "exists"
		updateOptions = $unset: exists: ""

		await db.RegistryImages.update updateQuery, updatePayload
		await db.RegistryImages.update updateQuery, updateOptions


updateDeviceGroups = ({ db, store, mqttClient }) ->
	new Promise (resolve) ->
		done = throttle (unsubscribeOnly) ->
			if unsubscribeOnly
				log.info "→ Groups updated for #{updates} device(s)"

				client.unsubscribe "devices/+/groups"
				client.unsubscribe "devices/+/state"
				resolve()
			else
				client.unsubscribe "devices/+/groups"
				client.subscribe   "devices/+/state"
		, 3000, leading: false

		skipUpdateFor = []
		updates       = 0
		client        = mqtt.connect Object.assign {},
			config.mqtt
			config.mqtt.connectionOptions
			clientId: "#{config.mqtt.clientId}#{random 1, 999999}"

		client.on "packetreceive", (packet) ->
			return unless packet.topic

			groupsPattern = "devices/+id/groups"
			statePattern  = "devices/+id/state"

			if MQTTPattern.matches groupsPattern, packet.topic
				# check for which devices we can skip updates for
				{ id } = MQTTPattern.exec groupsPattern, packet.topic
				skipUpdateFor.push id

				done false
			else if MQTTPattern.matches statePattern, packet.topic
				# publish the groups on a different topic
				# using the groups as they are known on MQTT
				{ id } = MQTTPattern.exec statePattern, packet.topic

				unless id in skipUpdateFor
					log.info "Updating groups for #{id}"

					{ deviceId, groups } = JSON.parse packet.payload.toString()
					topic                = "devices/#{deviceId}/groups"
					message              = JSON.stringify groups
					options              = retain: true

					query  = deviceId: deviceId
					update = groups: groups

					updates += 1

					await db.DeviceGroup.findOneAndUpdate query, update, upsert: true
					client.publish topic, message, options

				done true

		setTimeout ->
			done false unless skipUpdateFor.length

			setTimeout ->
				done true unless updates
			, 3000
		, 3000

		client.subscribe "devices/+/groups"

updateNullGroups = ({ db }) ->
	query  = groups: null
	update = groups: ["default"]
	count  = await db.DeviceGroup.find(query).countDocuments()

	return log.warn "→ No nulled groups" unless count

	{ nModified } = await db.DeviceGroup.updateMany query, update
	log.info "→ Updated groups for #{nModified} device(s)"

module.exports = ({ db, store }) ->
	if config.server.skipUpdates
		log.warn "Skipping updates"
		return Promise.resolve()

	try
		await Promise.all [
			updateGroups { db, store }
			updateExists { db, store }
			updateDeviceGroups { db, store }
			updateNullGroups { db }
		]

		log.info "→ Done"
		Promise.resolve()
	catch error
		Promise.reject new Error "Failed to apply one or more updates: #{error.message}"
