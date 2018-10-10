export const DB_NAMESPACE = 'db/'
export const DEVICES_NAMESPACE = 'devices/'
export const CONFIGURATIONS = 'CONFIGURATIONS'
export const CREATE_CONFIGURATION = 'CREATE_CONFIGURATION'
export const CONFIGURATION_SELECTED = 'CONFIGURATION_SELECTED'
export const STORE_CONFIGURATION = 'STORE_CONFIGURATION'
export const REMOVE_CONFIGURATION = 'REMOVE_CONFIGURATION'
export const APPLICATIONS = 'APPLICATIONS'

export const REMOVE_UNAVAILABLE_REGISTRY_IMAGE = 'REMOVE_UNAVAILABLE_REGISTRY_IMAGE'
export const ENABLED_REGISTRY_IMAGES = 'ENABLED_REGISTRY_IMAGES'
export const REFRESH_REGISTRY_IMAGES = 'REFRESH_REGISTRY_IMAGES'
export const ADD_ALLOWED_IMAGE = 'ADD_ALLOWED_IMAGE'
export const REMOVE_ALLOWED_IMAGE = 'REMOVE_ALLOWED_IMAGE'

export const CREATE_GROUP = 'CREATE_GROUP'
export const GROUPS = 'GROUPS'
export const REMOVE_GROUP = 'REMOVE_GROUP'
export const STORE_GROUP = 'STORE_GROUP'

export function createConfiguration (payload) {
	return {
		type: DB_NAMESPACE + CREATE_CONFIGURATION,
		payload,
	}
}

export function configurationSelected (configuration) {
	return {
		type:    CONFIGURATION_SELECTED,
		payload: configuration,
	}
}

export function sendConfigurationToAllDevices (payload) {
	return {
		type: DEVICES_NAMESPACE + STORE_CONFIGURATION,
		payload,
	}
}

export function removeConfiguration (payload) {
	return {
		type: DB_NAMESPACE + REMOVE_CONFIGURATION,
		payload,
	}
}

export function refreshRegistryImages () {
	return {
		type: DB_NAMESPACE + REFRESH_REGISTRY_IMAGES,
	}
}

export function removeUnavailableRegistryImage (payload) {
	return {
		type: DB_NAMESPACE + REMOVE_UNAVAILABLE_REGISTRY_IMAGE,
		payload,
	}
}

export function addAllowedImage (payload) {
	return {
		type: DB_NAMESPACE + ADD_ALLOWED_IMAGE,
		payload,
	}
}

export function removeAllowedImage (payload) {
	return {
		type: DB_NAMESPACE + REMOVE_ALLOWED_IMAGE,
		payload,
	}
}

export function createGroup (payload) {
	return {
		type: DB_NAMESPACE + CREATE_GROUP,
		payload,
	}
}

export function removeGroup (payload) {
	return {
		type: DB_NAMESPACE + REMOVE_GROUP,
		payload,
	}
}

export function sendGroupToAllDevices (payload) {
	return {
		type: DEVICES_NAMESPACE + STORE_GROUP,
		payload,
	}
}

export function removeGroupFromAllDevices (payload) {
	return {
		type: DEVICES_NAMESPACE + REMOVE_GROUP,
		payload,
	}
}
