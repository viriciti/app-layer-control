import { createSelector } from 'reselect'

const getGroups = state => {
	return state.get('groups')
}

const getConfigurations = state => {
	return state.get('configurations')
}

const getDependents = (groups, configurations) => {
	return configurations.map(configuration => {
		return groups
			.filter(group => {
				return group.keySeq().includes(configuration.get('applicationName'))
			})
			.map((_, group) => {
				return group
			})
			.toList()
	})
}

export default createSelector(
	[getGroups, getConfigurations],
	getDependents
)
