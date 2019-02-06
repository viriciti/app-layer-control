import { createSelector } from 'reselect'
import { List } from 'immutable'
import { first, last } from 'lodash'

const getActivity = name => state => state.getIn(['ui', name], List())
const getSelectedDevice = state => state.getIn(['ui', 'selectedDevice'])
const createPairs = entry => entry.split('|')

export default name => createSelector(
	[getActivity(name), getSelectedDevice],
	(applications, selectedDevice) =>
		applications.filter(entry => first(createPairs(entry)) === selectedDevice).map(entry => last(createPairs(entry)))
)
