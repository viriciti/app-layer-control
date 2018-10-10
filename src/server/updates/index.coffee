async   = require "async"
{ Map } = require "immutable"
log     = (require "../lib/Logger") "updates"

updateGroups = ({ db, store }, cb) ->
	store.getGroups (error, groups) ->
		return cb error if error
		return cb()     if groups.every (applications) -> Map.isMap applications

		log.info "Updating groups to new format ..."

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

					newApplications.set applicationName, enabledVersion
				, Map()

				query   = label: name
				payload = applications: updatedApplications.toJS()
				options = upsert: true

				db.Group.findOneAndUpdate query, payload, options, next
			, cb

module.exports = ({ db, store }, done) ->
	async.parallel [
		(cb) -> updateGroups { db, store }, cb
	], done
