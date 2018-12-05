assert         = require "assert"
{ pluck }      = require "underscore"
naturalCompare = require "natural-compare-lite"

createTestDatabase = require "./utils/createTestDatabase"
dropTestDatabase   = require "./utils/dropTestDatabase"
createStore        = require "../src/server/store"
enrichAppsForMqtt  = require "../src/server/helpers/enrichAppsForMqtt"

describe ".enrichAppsForMqtt", ->
	store  = null
	enrich = null

	before ->
		db         = await createTestDatabase()
		store      = createStore db
		{ enrich } = enrichAppsForMqtt db

	after ->
		dropTestDatabase()

	it "should throw if no label is specified", ->
		assert.throws ->
			enrich undefined, undefined

	it "should throw if no applications are specified", ->
		assert.throws ->
			enrich "default", undefined

	it "should determine the correct versions to run", (done) ->
		store.getGroups (error, groups) ->
			name         = "default"
			applications = groups
				.get name
				.toJS()

			enrich name, applications, (error, enriched) ->
				return done error if error

				fromImages = pluck enriched, "fromImage"
				expected   = ["hello-world:1.0.0", "hello-world:1.1.1", "hello-world:tag-1"]

				fromImages = fromImages.sort naturalCompare
				expected   = expected.sort naturalCompare

				assert.deepEqual fromImages, expected

				done()

		undefined
