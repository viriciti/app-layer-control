config               = require "config"
debug                = (require "debug") "app:plugins"
{ PluginManager }    = require "live-plugin-manager"
{ every, omit, map } = require "lodash"

log = (require "./lib/Logger") "plugins"

manager = new PluginManager unless every config.server.npm then {} else
	npmRegistryConfig:
		auth:
			username: config.server.npm.username
			password: config.server.npm.password
			email:    config.server.npm.email

validatePlugins = (plugins) ->
	plugins.forEach (plugin) ->
		throw new Error "Plugin is missing a name" unless plugin.name?

installPlugins = (plugins) ->
	log.warn "Installing #{plugins.length} plugin(s) ..."

	validatePlugins plugins

	await Promise.all plugins.map (plugin) ->
		try
			if plugin.path
				debug "Loading '#{plugin.name}' from filesystem (source at: #{plugin.path})"
				await manager.installFromPath plugin.path
			else
				debug "Installing '#{plugin.name}', version: #{plugin.version or "latest"}"
				await manager.install plugin.name, plugin.version
		catch error
			if error.message.match /error 404/
				log.error "Plugin '#{plugin.name}' not found"
			else
				throw error

	log.info "Installed #{plugins.length} plugin(s): #{map(plugins, "name").join ", "}"

runPlugins = (plugins, source$) ->
	debug "Running #{plugins.length} plugin(s) ..."
	for plugin in plugins
		fn             = manager.require plugin.name
		wrappedSource$ = source$
			.filter ({ _internal }) ->
				_internal
			.map (data) ->
				omit data, "_internal"

		fn wrappedSource$, plugin

module.exports = { installPlugins, runPlugins }
