config            = require "config"
debug             = (require "debug") "app:plugins"
{ PluginManager } = require "live-plugin-manager"
{ every, omit }   = require "lodash"

log = (require "./lib/Logger") "plugins"

manager = new PluginManager unless every config.server.npm then {} else
	npmRegistryConfig:
		auth:
			username: config.server.npm.username
			password: config.server.npm.password
			email:    config.server.npm.email

installPlugins = (plugins) ->
	log.warn "Installing #{plugins.length} plugin(s) ..."

	await Promise.all plugins.map (plugin) ->
		try
			debug "Installing '#{plugin.name}', version: #{plugin.version or "latest"}"
			await manager.install plugin.name, plugin.version
		catch error
			if error.message.match /error 404/
				log.error "Plugin '#{plugin.name}' not found"
			else
				throw error

	log.info "Installed #{plugins.length} plugin(s)"

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
