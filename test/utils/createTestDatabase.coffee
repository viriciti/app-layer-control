config     = require "config"
{ random } = require "underscore"

log     = (require "../../src/server/lib/Logger") "createTestDatabase"
connect = require "../../src/server/db"

createModels = (db) ->
	await db.Configuration.create
		applicationName: "hello-world-1"
		containerName:   "hello-world-1"
		version:         "1 - 2"
		fromImage:       "hello-world"
	,
		applicationName: "hello-world-2"
		containerName:   "hello-world-2"
		version:         "1 - 2"
		fromImage:       "hello-world"
	,
		applicationName: "hello-world-3"
		containerName:   "hello-world-3"
		version:         null
		fromImage:       "hello-world"

	await db.Group.create
		label:        "default"
		applications:
			"hello-world-1": "1.0.0" # lock to version 1.0.0
			"hello-world-2": null    # decide version based on semantic versioning
			"hello-world-3": "tag-1" # lock to tag tag-1

	await db.RegistryImages.create
		name:     "hello-world"
		versions: [
			"1.0.0"
			"1.1.1"
			"tag-1"
		]

module.exports = (cb) ->
	testDatabaseName = "app-layer-control-test-#{random 1, Number.MAX_SAFE_INTEGER}"
	options          = { config.db..., name: testDatabaseName }

	log.info "Database name: #{testDatabaseName}"
	db = connect options

	log.info "Creating models"
	await createModels db
	log.info "✓ Done"

	db
