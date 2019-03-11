import { Map, fromJS } from 'immutable'
import { omit } from 'lodash'

import { CONFIGURATIONS } from '/routes/administration/modules/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[CONFIGURATIONS] (state, action) {
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
