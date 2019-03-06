import { Map, fromJS } from 'immutable'

import { REGISTRY_IMAGES } from './actions'

const ACTION_HANDLERS = {
	[REGISTRY_IMAGES]: (state, action) => {
		return fromJS(action.payload)
	},
}

const initialState = Map()

export default function registryImagesReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
