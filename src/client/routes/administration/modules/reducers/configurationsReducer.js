import { Map, fromJS } from 'immutable'
import { omit, difference, map } from 'lodash'

import { CONFIGURATIONS } from '/routes/administration/modules/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[CONFIGURATIONS] (state, action) {
			if (state.size > action.payload.length) {
				difference(
					state.keySeq().toArray(),
					map(action.payload, 'applicationName')
				).forEach(name => {
					state = state.delete(name)
				})
			}

			return action.payload.reduce(
				(applications, application) =>
					applications.mergeIn(
						[application.applicationName],
						fromJS(omit(application, ['__v', '_id']))
					),
				state
			)
		},
	},
	Map()
)
