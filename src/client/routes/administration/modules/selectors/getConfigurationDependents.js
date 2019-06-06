import { createSelector } from 'reselect'

const getGroups = state => {
	return state.get('groups')
}

const getApplications = state => {
	return state.get('configurations')
}

const getDependents = (groups, applications) => {
	return applications.map(application => {
		return groups
			.filter(group =>
				group.keySeq().includes(application.get('applicationName'))
			)
			.map((_, group) => group)
			.toList()
	})
}

export default createSelector(
	[getGroups, getApplications],
	getDependents
)
