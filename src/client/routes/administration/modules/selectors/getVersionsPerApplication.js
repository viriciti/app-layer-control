import { createSelector } from 'reselect'
const getRegistryImages = state => {
	return state.get('registryImages')
}

const getConfigurations = state => {
	return state.get('configurations')
}

const getVersionsPerApplication = (registryImages, configurations) => {
	return configurations.map(configuration => {
		return registryImages.getIn([configuration.get('fromImage'), 'versions'])
	})
}

export default createSelector([getRegistryImages, getConfigurations], getVersionsPerApplication)
