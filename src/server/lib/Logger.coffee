winston = require "winston"

level = "info"
level = "debug" if process.env.DEBUG in ["1", "true"]

module.exports = (label) ->
	new winston.Logger transports: [
		new winston.transports.Console
			timestamp: true
			colorize:  true
			level:     level
			label:     label
	]
