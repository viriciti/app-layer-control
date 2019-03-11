import { List, fromJS } from 'immutable'
import { sortBy, omit } from 'lodash'

import { DEVICE_SOURCES } from '/routes/sources/modules/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[DEVICE_SOURCES] (_, action) {
			return fromJS(
				sortBy(action.payload, 'columnIndex').map(source =>
					omit(source, ['__v', '_id'])
				)
			)
		},
	},
	List()
)
