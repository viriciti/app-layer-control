import axios from 'axios'
import { toast } from 'react-toastify'

import { updateAsyncState } from '/store/globalReducers/ui'

export function asyncEditSource (name, payload) {
	return async dispatch => {
		dispatch(updateAsyncState('isSubmittingSource', true))

		const { name } = payload
		const { data } = await axios.put(`/api/v1/administration/source/${name}`, payload)

		toast.success(data.message)

		dispatch(updateAsyncState('isSubmittingSource', false))
	}
}

export function asyncAddSource (payload) {
	return async dispatch => {
		dispatch(updateAsyncState('isSubmittingSource', true))

		const { name } = payload
		const { data } = await axios.put(`/api/v1/administration/source/${name}`, payload)

		toast.success(data.message)

		dispatch(updateAsyncState('isSubmittingSource', false))
	}
}

// export function removeColumn (name) {
// 	return {
// 		type: DB_NAMESPACE + REMOVE_COLUMN,
// 		meta: {
// 			name,
// 		},
// 	}
// }
