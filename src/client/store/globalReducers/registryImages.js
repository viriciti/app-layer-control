import { Map, fromJS } from 'immutable'
import { pick } from 'lodash'

import { REGISTRY_IMAGES } from '/store/globalReducers/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[REGISTRY_IMAGES] (state, action) {
			return action.payload.reduce(
				(registry, image) =>
					registry.setIn(
						[image.name],
						fromJS(pick(image, ['access', 'versions']))
					),
				state
			)
		},
	},
	Map()
)
