import { Map, fromJS } from 'immutable'
import { pick, difference, map } from 'lodash'

import { REGISTRY_IMAGES } from '/store/globalReducers/actions'
import createReducer from '/store/createReducer'

export default createReducer(
	{
		[REGISTRY_IMAGES] (state, action) {
			if (state.size > action.payload.length) {
				difference(
					state.keySeq().toArray(),
					map(action.payload, 'name')
				).forEach(name => {
					state = state.delete(name)
				})
			}

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
