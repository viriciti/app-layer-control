async         = require "async"
{ Map }       = require "immutable"
log           = (require "../lib/Logger") "updates"
{ isBoolean } = require 'underscore'

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

module.exports = ({ db, store }) ->
	# :)
	new Promise (resolve, reject) ->
		async.parallel [
			(next) ->
				updateGroups { db, store }, next
			(next) ->
				updateExists { db, store }, next
		], (error) ->
			return reject new Error "Failed to apply one or more updates: #{error.message}" if error

			log.info "→ Done"
			resolve()
