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

## Getting started

1. Clone (or fork) the project
2. Run `npm install` to install the npm modules
3. Run `npm start` to start developing. Server will be restarted upon changes

### Configuration

While the default configuration provides a starting point, several settings are omitted for security reasons.  
These settings include the GitLab endpoint and Docker Registry endpoint.  
To configure those, add an extra configuration file (or update the default configuration, whatever floats your boat), and make sure the following settings are configured:

- `git.host`
- `docker.host`
- `docker.username`
- `docker.password`

**Note:** The dot represents a nested value. For example, the setting `username` is a setting within the setting `docker`.

### External sources

By default, the App Layer Control will show the information provided by the App Layer Agent.
However, there may be times where you want to show additional information.
To do so, create your own `.coffee` file in `server/sources/external`. File name can be anything you want.
The file **must** export an object with the following keys:

- _mapFrom_ (_array_): Where to get the current value from out of the observable data
- _mapTo_ (_array_): Where to set the new value in the state object
- _foreignKey_ (_array_): Where to get the device ID from out of the observable data
- _observable_ (_RxJS.Observable_)
