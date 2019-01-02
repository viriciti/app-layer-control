assert           = require "assert"
mqtt             = require "mqtt"
os               = require "os"
{ Server }       = require "mosca"
{ random, noop } = require "underscore"
MQTTPattern      = require "mqtt-pattern"
config           = require "config"

sendMessageToMqtt = require "../src/server/updates/sendMessageToMqtt"

randomPort  = random 50000, 60000
mqttUrl     = "mqtt://localhost:#{randomPort}"
mqttOptions = clientId: config.mqtt.clientId

describe.only ".sendMessageToMqtt", ->
	server      = null
	client      = null
	sendMessage = null

	beforeEach (done) ->
		server = new Server port: randomPort

		server.once "ready", ->
			client      = mqtt.connect mqttUrl, mqttOptions
			sendMessage = sendMessageToMqtt client

			client.once "connect", -> done()

	afterEach ->
		client.end()
		server.close()

		client = null
		server = null

	it "should publish on commands path", (done) ->
		server.on "published", ({ topic }) ->
			return if topic.startsWith "$SYS"
			done()

		sendMessage
			action: "hello"
			dest:   os.hostname()
		, noop

	it "should publish on the correct topic", (done) ->
		server.on "published", ({ topic }) ->
			return if topic.startsWith "$SYS"

			assert.ok MQTTPattern.matches "commands/+id/+actionId", topic
			done()

		sendMessage
			action: "hello"
			dest:   os.hostname()
		, noop

	it "should subscribe to the response topic", (done) ->
		subscribeTo  = "commands/+/+"
		publishOn    = ["commands", mqttOptions.clientId]
		topicPattern = "commands/+/+actionId"

		client.once "message", (topic) ->
			return unless MQTTPattern.matches subscribeTo, topic

			{ actionId } = MQTTPattern.exec topicPattern, topic
			response     = status: "OK"

			publishOn.push actionId
			publishOn.push "response"
			publishOn = publishOn.join "/"

			client.unsubscribe subscribeTo
			client.publish publishOn, JSON.stringify response

		server.on "published", ({ topic }) ->
			return if topic.startsWith "$SYS"
			return if MQTTPattern.matches topicPattern, topic

			assert.ok topic, publishOn
			done()

		client.subscribe subscribeTo

		sendMessage
			action: "hello"
			dest:   os.hostname()
		, noop

	it "should send origin and action in the payload", (done) ->
		server.on "published", (packet) ->
			{ topic, payload } = packet
			message            = JSON.parse payload.toString()
			return if topic.startsWith "$SYS"

			assert.equal message.origin, mqttOptions.clientId
			assert.equal message.action, "hello"
			done()

		sendMessage
			action: "hello"
			dest:   os.hostname()
		, noop

	it "should send payload if there is a payload", (done) ->
		server.on "published", (packet) ->
			{ topic, payload } = packet
			message            = JSON.parse payload.toString()
			return if topic.startsWith "$SYS"

			assert.equal message.origin, mqttOptions.clientId
			assert.equal message.action, "hello"
			assert.ok    message.payload
			done()

		sendMessage
			action: "hello"
			dest:   os.hostname()
			payload:
				we:        "have"
				something: true
		, noop

	it "should not send irrelevant data in the payload", (done) ->
		server.on "published", (packet) ->
			{ topic, payload } = packet
			message            = JSON.parse payload.toString()
			return if topic.startsWith "$SYS"

			assert.deepEqual message,
				origin: mqttOptions.clientId
				action: "hello"
				payload:
					this:    "is"
					correct: true
			done()

		sendMessage
			action: "hello"
			dest:   os.hostname()
			payload:
				this:    "is"
				correct: true
			a:   true
			b:   "hoi"
			def: "initely"
		, noop

	it "should timeout after a while", (done) ->
		sendMessage
			action: "hello"
			dest:   os.hostname()
			payload:
				timeout: true
		, (error) ->
			assert.ok    error
			assert.equal error.message, "Socket timed out"
			done()

	it "should discard response after timeout", (done) ->
		topicPattern = "commands/+/+actionId"

		server.on "published", (packet) ->
			{ topic } = packet
			return if topic.startsWith "$SYS"
			return if topic.endsWith   "/response"

			{ actionId } = MQTTPattern.exec topicPattern, topic
			response     = status: "OK"
			publishOn    = ["commands", mqttOptions.clientId]

			publishOn.push actionId
			publishOn.push "response"
			publishOn = publishOn.join "/"

			setTimeout ->
				server.publish
					topic:   publishOn
					payload: response
			, 750

			setTimeout ->
				done()
			, 1250

		sendMessage
			action: "hello"
			dest:   os.hostname()
			payload:
				timeout: "test"
		, (error) ->
			assert.ok    error
			assert.equal error.message, "Socket timed out"
