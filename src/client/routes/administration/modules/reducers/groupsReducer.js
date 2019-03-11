import { Map, fromJS } from 'immutable'

import { GROUPS } from '/routes/administration/modules/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[GROUPS] (state, action) {
			return action.payload.reduce(
				(groups, group) =>
					groups.mergeIn([group.label], fromJS(group.applications)),
				state
			)
		},
	},
	Map()
)
