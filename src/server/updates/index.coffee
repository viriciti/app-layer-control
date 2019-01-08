async                   = require "async"
log                     = (require "../lib/Logger") "updates"
mqtt                    = require "mqtt"
{ Map }                 = require "immutable"
{ isBoolean, throttle } = require "lodash"
config                  = require "config"
MQTTPattern             = require "mqtt-pattern"

updateGroups = ({ db, store }, cb) ->
	store.getGroups (error, groups) ->
		return cb error if error

		if groups.every (applications) -> Map.isMap applications
			log.warn "→ No need to update groups"
			return cb()
		else
			log.info "→ Updating groups to new format ..."

		async.parallel [
			store.getEnabledRegistryImages
			store.getConfigurations
		], (error, [enabledRegistryImages, configurations]) ->
			return cb error if error

			async.each groups, (group, next) ->
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

				async.parallel [
					(cb) ->
						db.Group.findOneAndUpdate updateQuery, updatePayload, updateOptions, cb
					(cb) ->
						db.RegistryImages.update {}, updatePayloadUnset, cb
				], next
			, cb

updateExists = ({ db, store }, cb) ->
	store.getRegistryImages (error, images) ->
		isUpdated = images.every (image) ->
			isBoolean image.get "access"

		if isUpdated
			log.warn "→ No need to update registry images"
			return cb()
		else
			log.info "→ Updating registry images ..."

		async.each images, ([name, image], next) ->
			updateQuery   = { name }
			updatePayload = access: image.get "exists"
			updateOptions = $unset: exists: ""

			async.series [
				(cb) ->
					db.RegistryImages.update updateQuery, updatePayload, cb
				(cb) ->
					db.RegistryImages.update updateQuery, updateOptions, cb
			], next
		, cb

updateDeviceGroups = ({ db, store, mqttClient }, cb) ->
	done = throttle (unsubscribeOnly) ->
		if unsubscribeOnly
			log.info "→ Groups updated for #{updates} device(s)"

			client.unsubscribe "devices/+/groups"
			client.unsubscribe "devices/+/state"
			cb()
		else
			client.unsubscribe "devices/+/groups"
			client.subscribe   "devices/+/state"
	, 3000, leading: false

	skipUpdateFor = []
	updates       = 0
	client        = mqtt.connect Object.assign {},
		config.mqtt
		config.mqtt.connectionOptions
		clientId: "updater/#{config.mqtt.clientId}"

	client.on "packetreceive", (packet) ->
		return unless packet.topic

		groupsPattern = "devices/+id/groups"
		statePattern  = "devices/+id/state"

		if MQTTPattern.matches groupsPattern, packet.topic
			{ id } = MQTTPattern.exec groupsPattern, packet.topic
			skipUpdateFor.push id

			done false
		else if MQTTPattern.matches statePattern, packet.topic
			{ id } = MQTTPattern.exec statePattern, packet.topic

			unless id in skipUpdateFor
				log.info "Updating groups for #{id}"

				{ deviceId, groups } = JSON.parse packet.payload.toString()
				topic                = "devices/#{deviceId}/groups"
				message              = JSON.stringify groups
				options              = retain: true

				updates += 1
				client.publish topic, message, options

			done true

	setTimeout ->
		done false unless skipUpdateFor.length
	, 3000

	client.subscribe "devices/+/groups"

module.exports = ({ db, store }) ->
	# :)
	new Promise (resolve, reject) ->
		async.parallel [
			(next) ->
				updateGroups { db, store }, next
			(next) ->
				updateExists { db, store }, next
			(next) ->
				updateDeviceGroups { db, store }, next
		], (error) ->
			return reject new Error "Failed to apply one or more updates: #{error.message}" if error

			log.info "→ Done"
			resolve()
