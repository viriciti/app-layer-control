import { createSelector } from 'reselect'
import { Map } from 'immutable'
import { isArray } from 'lodash'

const getActions = state => state.getIn(['ui', 'actions'], Map())

export default keyPath => {
	if (!isArray(keyPath)) {
		keyPath = [keyPath]
	}

	return createSelector(
		getActions,
		actions => actions.getIn(keyPath, false)
	)
}
