import { createSelector } from 'reselect'
import { List } from 'immutable'
import { first, last } from 'lodash'

const isFetchingLogs = state => state.getIn(['userInterface', 'isFetchingLogs'], List())
const selectedDevice = state => state.getIn(['userInterface', 'selectedDevice'])
const createPairs = entry => entry.split('|')

export default createSelector(
	[isFetchingLogs, selectedDevice],
	(applications, selectedDevice) =>
		applications.filter(entry => first(createPairs(entry)) === selectedDevice).map(entry => last(createPairs(entry)))
)
