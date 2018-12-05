import { Map, List, fromJS } from 'immutable'

import { MULTISELECT_DEVICE, MULTISELECT_DEVICES, MULTISELECT_ACTION, MULTISELECT_ACTION_CLEAR } from 'routes/devices/modules/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
	[MULTISELECT_DEVICE]: (state, action) => {
		const deviceId = action.payload
		const selected = state.get('selected')
		const selectedIndex = selected.findIndex(device => {
			return device === deviceId
		})

		if (selected.includes(deviceId)) {
			return state.set('selected', selected.delete(selectedIndex))
		} else {
			return state.set('selected', selected.concat(deviceId))
		}
	},

	[MULTISELECT_DEVICES]: (state, action) => {
		const deviceIds = action.payload

		if (state.get('selected').size === deviceIds.size) {
			return state.set('selected', List())
		} else {
			return state.set('selected', deviceIds)
		}
	},

	[MULTISELECT_ACTION]: (state, action) => {
		if (!action.payload) {
			return state.set('action', Map())
		} else {
			return state.set('action', fromJS(action.payload))
		}
	},

	[MULTISELECT_ACTION_CLEAR]: () => {
		return initialState
	},
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = Map({
	selected: List(),
	action:   Map(),
})

export default function multiSelectReducer (state = initialState, action) {
	const handler = ACTION_HANDLERS[action.type]
	return handler ? handler(state, action) : state
}
