async  = require "async"
debug  = (require "debug") "app:helpers:enrich-for-mqtt"
semver = require "semver"
_      = require "underscore"

module.exports = (db) ->
	enrich = (label, applications, cb) ->
		return cb new Error "No label specified"        unless label
		return cb new Error "No applications specified" unless applications?

		debug "enrich called with label: #{label} applications: #{JSON.stringify applications}"
		async.waterfall [
			(next) ->
				async.parallel [
					(cb) ->
						_getApplicationsConfiguration applications, cb
					(cb) ->
						_getGroupConfiguration label, cb
				], next
			([configurations, group], next) ->
				_getLatestInstallableApplications configurations, group, next
		], cb

	_getGroupConfiguration = (label, cb) ->
		db.Group.findOne { label }, cb

	_getApplicationsConfiguration = (applications, cb) ->
		async.mapValues applications, (version, app, next) ->
			db.Configuration.findOne { applicationName: app }, next
		, cb

	_getLatestInstallableApplications = (configurations, group, cb) ->
		{ label, applications } = group

		async.reduce configurations, {}, (apps, config, next) ->
			db.RegistryImages.findOne { name: config.fromImage }, (error, app) ->
				return next error                                                       if error
				throw new Error "No registry images configured for #{config.fromImage}" unless app?

				versions = app.versions.filter (tag) -> semver.valid tag

				if /test$/.test label
					versionToInstall = semver.maxSatisfying versions, config.version
				else
					if applications[config.applicationName]
						versionToInstall = applications[config.applicationName]
					else
						versionToInstall = semver.maxSatisfying versions, config.version

				debug "Version enriched: #{config.applicationName}@#{versionToInstall}"
				containerName = config.containerName

				enrichedConfig               = _(config.toObject()).omit ["_id", "__v", "version"]
				enrichedConfig.fromImage     = "#{config.fromImage}:#{versionToInstall}"
				enrichedConfig.containerName = "#{containerName}"
				enrichedConfig.labels        =
					group:  label
					manual: "false"

				appToInstall = {}
				appToInstall[containerName] = enrichedConfig

				next null, _.extend {}, apps, appToInstall
		, cb

	return { enrich }
