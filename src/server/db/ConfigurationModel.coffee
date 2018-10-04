{ Schema } = require "mongoose"

module.exports = (mongoose) ->
	Configuration = mongoose.model "configuration",
		applicationName: String
		containerName:   String
		detached:        Boolean
		environment:     [ String ]
		fromImage:       String
		frontEndPort:    Number
		lastInstallStep: String
		mounts:          [ String ]
		networkMode:     String
		ports:           Schema.Types.Mixed
		privileged:      Boolean
		restartPolicy:   String
		version:         String
		webAppPort:      Number

	return Configuration
