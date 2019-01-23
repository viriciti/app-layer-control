debug  = (require "debug") "app:helpers:enrich-for-mqtt"
map    = require "p-map"
reduce = require "p-reduce"
semver = require "semver"

Database = require "../db"

db = new Database autoConnect: true

getApplicationsConfiguration = (names) ->
	map names, (name) ->
		db
			.Configuration
			.findOne applicationName: name
			.select "-_id -__v -version"
			.lean()

getGroupConfiguration = (label) ->
	db
		.Group
		.findOne label: label
		.select "-_id -__v"
		.lean()

getLatestInstallableApplications = ({ configurations, group }) ->
	{ label, applications } = group

	reduce configurations, (memo, configuration) ->
		{ fromImage } = configuration
		application   = await db
			.RegistryImages
			.findOne name: fromImage
			.select "-_id -__v -exists"
			.lean()

		throw new Error "No registry images configured for #{fromImage}" unless application?

		{
			applicationName
			containerName
			fromImage
			version
		}        = configuration
		versions = application.versions.filter semver.valid

		# if application has a locked version
		# set version to install to locked version
		# otherwise, determine based on semver
		if applications[applicationName]
			versionToInstall = applications[applicationName]
		else
			versionToInstall = semver.maxSatisfying versions, version

		debug "(#{label}) Version enriched: #{applicationName}@#{versionToInstall}"

		Object.assign {}, memo,
			"#{containerName}": Object.assign {}, configuration,
				fromImage:     "#{fromImage}:#{versionToInstall}"
				containerName: containerName
				labels:
					group:  label
					manual: "false"
	, {}

module.exports = (label, applications) ->
	return Promise.reject new Error "No label specified"        unless label
	return Promise.reject new Error "No applications specified" unless applications?

	[configurations, group] = await Promise.all [
		getApplicationsConfiguration Object.keys applications
		getGroupConfiguration label
	]

	getLatestInstallableApplications
		configurations: configurations
		group:          group
