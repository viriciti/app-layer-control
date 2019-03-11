import { createSelector } from 'reselect'
import { List } from 'immutable'

const getRegistryImages = state => {
	return state.get('registryImages')
}

const getApplications = state => {
	return state.get('configurations', List())
}

const getVersionsPerApplication = (registryImages, applications) => {
	return applications.map(configuration => {
		return registryImages.getIn([configuration.get('fromImage'), 'versions'])
	})
}

export default createSelector(
	[getRegistryImages, getApplications],
	getVersionsPerApplication
)
