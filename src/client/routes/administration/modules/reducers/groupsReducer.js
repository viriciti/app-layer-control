import { Map, fromJS } from 'immutable'
import { difference, map } from 'lodash'

import { GROUPS } from '/routes/administration/modules/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[GROUPS] (state, action) {
			if (state.size > action.payload.length) {
				difference(
					state.keySeq().toArray(),
					map(action.payload, 'label')
				).forEach(name => {
					state = state.delete(name)
				})
			}

			return action.payload.reduce(
				(groups, group) =>
					groups.setIn([group.label], fromJS(group.applications)),
				state
			)
		},
	},
	Map()
)
