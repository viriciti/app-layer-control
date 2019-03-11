import { size } from 'lodash'

export default function createReducer (actionHandlers, initialState) {
	const handlersCount = size(actionHandlers)
	const actionNames   = Object.keys(actionHandlers)
	console.log(`Registering ${handlersCount} action handler(s): ${actionNames.join(', ')}`)

	return (state = initialState, action) => {
		if (actionHandlers[action.type]) {
			return actionHandlers[action.type](state, action)
		} else {
			return state
		}
	}
}
