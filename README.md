# App Layer Control

![](https://img.shields.io/badge/app--layer--agent-%5E1.19.0-lightgrey.svg)
![](https://img.shields.io/github/last-commit/viriciti/app-layer-control.svg)
![](https://img.shields.io/david/viriciti/app-layer-control.svg)
![](https://img.shields.io/david/dev/viriciti/app-layer-control.svg)

## Dependencies

- MongoDB
- GitLab (with Docker integration)
- MQTT

If you have [Docker Compose](https://docs.docker.com/compose/) installed, you can also run `docker-compose up -d`.
It is advised to _not_ use this in production (as it is not secure), but to configure the components separately instead.

### Post installation

App Layer Control requires a replica set to keep (connected) devices up to date with database changes and reduces code clutter.

This requires you to initiate the replica set within the MongoDB container. To do this, go to your terminal and enter: `docker exec -it mongodb mongo`.
You are now in the [mongo](https://docs.mongodb.com/manual/reference/program/mongo/#bin.mongo) shell. Once inside, execute the following command:

```
rs.initiate({
    _id: "rs0",
    members: [
        { _id: 0, host: "localhost:27017" }
    ]
})
```

This will initiate the replica set and you're ready to go.

**Note**: Once you enter the [mongo](https://docs.mongodb.com/manual/reference/program/mongo/#bin.mongo) shell, ensure that the line of where your cursor blinks starts with `rs0:PRIMARY`. This tells you whether the instance is running in a replica set. If this is not the case, kill the containers (`docker-compose down`) and create them again (`docker-compose up -d`).

## Getting started

1. Clone (or fork) the project
2. Run `npm install` to install the npm modules
3. Run `npm start` to start developing. Server will be restarted upon changes

> Your installation may fail when installing the npm modules. To fix this, get a Font Awesome Pro token and read [the Font Awesome installation guide](https://fontawesome.com/how-to-use/on-the-web/setup/using-package-managers#installing-pro).

### Configuration

Configuring App Layer Control is done through a configuration file (requiring you to mount it manually) and environment variables.
We recommend using environment variables, since these will cause the least configuration issues over time.

- `MQTT_HOST` (_Optional_): MQTT endpoint. Default: localhost
- `MQTT_PORT` (_Optional_): MQTT port. Default: 1883
- `DB_HOSTS` (_Optional_): Comma-separated database hosts. Default: localhost:27017
- `DB_NAME` (_Optional_): Name of the database. Default: app-layer-control
- `DB_REPLICA_SET` (_Optional_): Name of the replica set. Default: rs0
- `NPM_USERNAME` (_Optional_): NPM username. Allow you to install private packages
- `NPM_PASSWORD` (_Optional_): NPM password. Allow you to install private packages
- `NPM_EMAIL` (_Optional_): Mandatory for NPM
- `GITLAB_HOST` (_Required_): GitLab endpoint. Required and used to request an authentication token
- `GITLAB_USERNAME` (_Required_): GitLab username. Required and used to request an authentication token
- `GITLAB_ACCESS_TOKEN` (_Required_): GitLab access token. Required and used to request an authentication token.
- `DOCKER_REGISTRY` (_Required_): Docker Registry endpoint. Required to construct the URL to pull from

### Plugins (previously "External sources")

App Layer Control allows you to add your own plugins. Plugins are powerful extensions that allow you to read data directly from the sources.
Additionally, plugins allow you to update the state of a device.

#### Installation

Plugins are installed on-the-fly from NPM and do not require you to install them yourself.
For now, there is no support for GitHub. Instead, you can load a plugin from your filesystem by adding a `path` key to your configuration.

#### Creating your plugin

The plugin must export a function and can take up to two arguments:

- source (_Rx.Subject_): The data stream itself. You can do anything you normally can with [Subjects](https://github.com/ReactiveX/rxjs/blob/master/doc/subject.md). Because Subjects are bidirectional, you can call `.next()` in order to update the state information on App Layer Control. The updated state information must consist of a `deviceId` and `data` property. Any update you make is buffered for a second and then merged with the state of the devices.
- context (_Object_): Context of the plugin, such as name and configuration. _Do not require [node-config](https://www.npmjs.com/package/config) within the plugin, as this may not be fully supported by the [https://nodejs.org/api/vm.html](Virtual Machine). Instead, pass the configuration within your plugin context and use that in your plugin._
