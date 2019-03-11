import { combineReducers } from 'redux-immutable'
import { reducer as formReducer } from 'redux-form'

import devicesReducer from '/routes/devices/reducers/devicesReducer'
import devicesLogsReducer from '/routes/devices/reducers/devicesLogsReducer'
import multiSelectReducer from '/routes/devices/reducers/multiSelectReducer'
import groupsReducer from '/routes/administration/modules/reducers/groupsReducer'
import registryImagesReducer from './globalReducers/registryImages'
import configurationsReducer from '/routes/administration/modules/reducers/configurationsReducer'
import paginateReducer from '/routes/devices/reducers/paginateReducer'
import deviceSourcesReducer from '../routes/sources/modules/reducer'
import allowedImagesReducer from './globalReducers/allowedImages'
import uiReducer from './globalReducers/ui'

export const makeRootReducer = asyncReducers => {
	return combineReducers({
		...asyncReducers,
		devices:        devicesReducer,
		devicesLogs:    devicesLogsReducer,
		form:           formReducer,
		groups:         groupsReducer,
		configurations: configurationsReducer,
		registryImages: registryImagesReducer,
		multiSelect:    multiSelectReducer,
		paginate:       paginateReducer,
		deviceSources:  deviceSourcesReducer,
		allowedImages:  allowedImagesReducer,
		ui:             uiReducer,
	})
}

export const injectReducer = (store, { key, reducer }) => {
	if (Object.hasOwnProperty.call(store.asyncReducers, key)) return

	store.asyncReducers[key] = reducer
	store.replaceReducer(makeRootReducer(store.asyncReducers))
}

export default makeRootReducer
