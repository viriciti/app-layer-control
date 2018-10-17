import { validRange, ltr } from 'semver'

const validate = values => {
	const errors = {}

	if (!values.applicationName) {
		errors.applicationName = 'Enter an application name'
	} else if (values.applicationName.length > 30) {
		errors.applicationName = 'Application name should not be longer than 30 characters'
	}

	if (!values.containerName) {
		errors.containerName = 'Enter a container name'
	} else if (values.containerName.length > 30) {
		errors.containerName = 'Container name should not be longer than 30 characters'
	}

	if (!values.fromImage) {
		errors.fromImage = 'Select the image to run'
	}

	if (!values.version) {
		errors.version = 'Select a version range'
	} else if (!validRange(values.version)) {
		errors.version = 'Invalid semantic version'
	} else if (validRange(values.version) && !ltr('0.0.0', values.version)) {
		errors.version = 'This semantic version is not supported'
	}

	if (values.frontEndPort && (values.frontEndPort < 1 || values.frontEndPort > 65535)) {
		errors.frontEndPort = 'Out of range. Choose a port between 1 and 65535'
	}

	return errors
}

export default validate
