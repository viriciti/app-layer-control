import { createSelector } from 'reselect'
import { List } from 'immutable'

const getGroups = state => {
	return state.get('groups')
}

const getGroupsNames = groups => {
	if (!groups) {
		return List()
	} else {
		return groups.keySeq()
	}
}

export default createSelector(getGroups, getGroupsNames)
