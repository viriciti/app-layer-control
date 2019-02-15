import { createSelector } from 'reselect'
import { Map } from 'immutable'
import { isArray } from 'lodash'

const getActions = state => state.getIn(['ui', 'actions'], Map())

export default name => {
	if (!isArray(name)) {
		name = [name]
	}

	return createSelector(
		getActions,
		actions => {
			if (actions.hasIn(name)) {
				return actions.getIn(name)
			} else {
				console.debug(`Action '${name.join('.')}' not found, returning default value`)
				return false
			}
		}
	)
}
