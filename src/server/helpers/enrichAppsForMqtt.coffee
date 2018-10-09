async  = require "async"
debug  = (require "debug") "app:helpers:enrich-for-mqtt"
semver = require "semver"
_      = require "underscore"

module.exports = (db) ->
	enrich = (label, applications, cb) ->
		debug "enrich called with label: #{label} applications: #{JSON.stringify applications}"
		async.waterfall [
			(next) ->
				_getApplicationsConfiguration applications, next
			(configurations, next) ->
				_getLatestInstallableApplications configurations, label, next
		], cb

	_getApplicationsConfiguration = (applications, cb) ->
		async.mapValues applications, (version, app, next) ->
			db.Configuration.findOne { applicationName: app }, (error, doc) ->
				return next error if error
				debug "Get Configuration from db", app, doc
				next null, doc
		, cb

	_getLatestInstallableApplications = (configurations, groupLabel, cb) ->
		async.reduce configurations, {}
		, (apps, config, next) ->

			db.RegistryImages.findOne { name: config.fromImage }, (error, app) ->
				return next error if error

				if /test$/.test groupLabel
					versionToInstall = semver.maxSatisfying app.versions, config.version
				else
					if app.enabledVersion
						versionToInstall = app.enabledVersion
					else
						versionToInstall = semver.maxSatisfying app.versions, config.version


				containerName = config.containerName

				enrichedConfig               = _(config.toObject()).omit ["_id", "__v", "version"]
				enrichedConfig.fromImage     = "#{config.fromImage}:#{versionToInstall}"
				enrichedConfig.containerName = "#{containerName}"
				enrichedConfig.labels        =
					group:  groupLabel
					manual: "false"

				appToInstall = {}
				appToInstall[containerName] = enrichedConfig

				next null, _.extend {}, apps, appToInstall
		, cb

	return { enrich }
