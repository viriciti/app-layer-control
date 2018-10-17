## Dependencies

- MongoDB
- GitLab (with Docker integration)
- MQTT

## Getting started

1. Fork the project
2. Run `npm install` to install the npm modules
3. Run `npm start` to start developing. Server will be restarted upon changes.

## Customisation

The project comes with no branding by default. To add your own branding, a few files must be updated/replaced.

### Logo

The component responsible for displaying the navigation expects the logo to exist at `client/assets/logo/logo.png`. Currently, it does not support other extensions besides `.png`. The filesize or image size does not matter, but we recommend a size of at least 30x30 or higher.

### Loader

Apart from the logo, the styling expects a loader to exist at `client/assets/loader/loader.gif`.

### Favicon

If you want to use your own favicon, add it at `client/assets/favicon.ico`.

### Colors

The styling has been made modular to the best of its extend. Thus, providing your own brand color is trivial.  
All you have to do is change the variable `$color-brand` to use your own color in `client/styles/base/_variables.scss`.

### External sources

By default, the App Layer Control will show the information provided by the App Layer Agent.  
However, there may be times where you want to show additional information.  
To do so, create your own `.coffee` file in `server/sources/external`. File name can be anything you want.  
The file **must** export an object with the following keys:

- _mapFrom_ (_array_): Where to get the current value from out of the observable data
- _mapTo_ (_array_): Where to set the new value in the state object
- _foreignKey_ (_array_): Where to get the device ID from out of the observable data
- _observable_ (_RxJS.Observable_)
