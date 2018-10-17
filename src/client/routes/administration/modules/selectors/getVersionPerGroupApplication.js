import { createSelector } from 'reselect'
import { Map } from 'immutable'

const getRegistryImages = state => {
	return state.get('registryImages')
}

const getConfigurations = state => {
	return state.get('configurations')
}

const getGroups = state => {
	return state.get('groups')
}

const getVersionPerGroupApplication = (groups, registryImages, configurations) => {
	return groups.map(applications => {
		return configurations
			.filter(configuration => {
				return applications
					.keySeq()
					.toArray()
					.includes(configuration.get('applicationName'))
			})
			.map(configuration => {
				return Map({
					currentVersion: applications.get(configuration.get('applicationName')),
					versions:       registryImages.getIn([configuration.get('fromImage'), 'versions']),
				})
			})
	})
}

export default createSelector([getGroups, getRegistryImages, getConfigurations], getVersionPerGroupApplication)
