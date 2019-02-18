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

Since [version], App Layer Control requires a replica set.  
This enables App Layer Control to keep (connected) devices up to date with database changes and reduces code clutter.

However, this requires you to initiate the replica set within the MongoDB container. To do this, go to your terminal and enter: `docker exec -it mongodb /bin/sh`. Once you are in the container, enter: `mongo`.  
You are now in the [mongo](https://docs.mongodb.com/manual/reference/program/mongo/#bin.mongo) shell. Once inside, execute the following command:

```
rs.initiate({
    _id: "rs0",
    members: [
        { _id: 0, host: "mongodb:27017" }
    ]
})
```

This will initiate the replica set and you're ready to go.

**Note**: Once you enter the [mongo](https://docs.mongodb.com/manual/reference/program/mongo/#bin.mongo) shell, ensure that the line of where your cursor blinks starts with `rs0:PRIMARY`. This tells you whether the instance is running in a replica set. If this is not the case, kill the containers (`docker-compose down`) and create them again (`docker-compose up -d`).

## Getting started

1. Clone (or fork) the project
2. Run `npm install` to install the npm modules
3. Run `npm start` to start developing. Server will be restarted upon changes

### Configuration

While the default configuration provides a starting point, several settings are omitted for security reasons.  
These settings include the GitLab endpoint and Docker Registry endpoint.  
To configure those, add an extra configuration file (or update the default configuration, whatever floats your boat), and make sure the following settings are configured:

- `git.host`: GitLab endpoint. Required to request an authentication token
- `docker.host`: Docker Registry endpoint
- `docker.username`: GitLab username
- `docker.password`: GitLab access token (we highly discourage the use of a password)

**Note:** The dot represents a nested value. For example, the setting `username` is a setting within the setting `docker`.

### Plugins (previously "External sources")

App Layer Control allows you to add your own plugins. Plugins are powerful extensions that allow you to read data directly from the sources.  
Additionally, plugins allow you to update the state of a device.

Plugins are installed on-the-fly from NPM (no support for GitHub at the moment) and do not require you to install them yourself.  
The plugin must export a function and can take up to two arguments:

- source (_Rx.Subject_): The data stream itself. You can do anything you normally can with [Subjects](https://github.com/ReactiveX/rxjs/blob/master/doc/subject.md). Because Subjects are bidirectional, you can call `.next()` in order to update the state information on App Layer Control. The updated state information must consist of a `deviceId` and `data` property.
- context (_Object_): Context of the plugin, such as name and configuration. _Do not require [node-config](https://www.npmjs.com/package/config) within the plugin, as this may not be fully supported by the [https://nodejs.org/api/vm.html](Virtual Machine). Instead, pass the configuration within your plugin context and use that in your plugin._
