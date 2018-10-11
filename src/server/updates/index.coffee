async   = require "async"
{ Map } = require "immutable"
log     = (require "../lib/Logger") "updates"

updateGroups = ({ db, store }, cb) ->
	store.getGroups (error, groups) ->
		return cb error if error

		if groups.every((applications) -> Map.isMap applications)
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

				updateQuery   = label: name
				updatePayload = applications: updatedApplications.toJS()
				updateOptions = upsert: true

				db.Group.findOneAndUpdate updateQuery, updatePayload, updateOptions, next
			, (error) ->
				return cb error if error

				log.info "→ Done"
				cb()

module.exports = ({ db, store }, cb) ->
	updateGroups { db, store }, cb
