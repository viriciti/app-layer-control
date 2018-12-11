{ Observable } = require "rxjs"
async          = require "async"
ApiClient      = require "@tn-group/api-client"
config         = require "config"
_              = require "underscore"
log            =  require("../../lib/Logger") "externals:vid"

apiClient = new ApiClient config.portalApi

HOUR             = 60 * 60 * 1000
BACK_OFF_MS      = 100
AMOUNT_PER_BATCH = 50

batchifyRequest = (source) ->
	return batchifyRequest [source] unless _.isArray source

	batchesAmount = Math.ceil source.length / AMOUNT_PER_BATCH
	batches       = []

	_.times batchesAmount, (batchNumber) ->
		fromIndex = AMOUNT_PER_BATCH * batchNumber
		toIndex   = AMOUNT_PER_BATCH * (batchNumber + 1)
		batches.push source.slice fromIndex, toIndex

	batches

getDevices = (storedDevices = [], cb) ->
	return setImmediate cb, null, [] unless storedDevices.length

	async.map batchifyRequest(storedDevices), (devices, next) ->
		request =
			uri: "devices"
			qs:
				fields: [ "_id", "serial" ]
				where:  serial: devices
			headers: "Cache": false

		apiClient.get request, next
	, (error, devices) ->
		return cb error if error
		cb null, _.flatten devices

getVid = (device, cb) ->
	request =
		uri:     "assets"
		qs:
			fields: [ "vid" ]
			where: device: device._id
		headers: "Cache": true

	apiClient.get request, (error, body, response) ->
		return cb error if error

		asset = _.first body

		return cb() unless asset?.vid

		cb null, vid: asset.vid, serial: device.serial

# TODO make class?
module.exports = (getDeviceStates) ->
	mapTo:      [ "vid" ]    # Where to set the data in the state object
	foreignKey: [ "serial" ] # Where to get the clientId out of the observable data
	mapFrom:    [ "vid" ]    # Where to get the data from out of the observable data
	observable: Observable.create (subscriber) ->
		repeat = ->
			storedDevices = getDeviceStates().keySeq().toArray()
			log.info "Getting vids for #{storedDevices.length} clientIds"
			async.waterfall [
				(cb) ->
					getDevices storedDevices, cb
				(devices = [], cb) ->
					async.eachSeries devices, (device, cb) ->
						getVid device, (error, data) ->
							return cb error if error
							return cb() unless data?.vid

							subscriber.next data
							setTimeout cb, BACK_OFF_MS
					, cb
			], (error) ->
				log.error error if error
				setTimeout repeat, HOUR
		setTimeout repeat, 10000
