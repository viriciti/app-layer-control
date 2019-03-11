import axios from 'axios'
import { toast } from 'react-toastify'

import { setAsyncState } from '/store/globalReducers/ui'

export const DEVICE_SOURCES = 'DEVICE_SOURCES'

export function asyncEditSource (name, payload) {
	return async dispatch => {
		dispatch(setAsyncState('isSubmittingSource', true))

		const { headerName } = payload
		const { data }       = await axios.put(
			`/api/v1/administration/source/${headerName}`,
			payload
		)

		toast.success(data.message)

		dispatch(setAsyncState('isSubmittingSource', false))
	}
}

export function asyncAddSource (payload) {
	return async dispatch => {
		dispatch(setAsyncState('isSubmittingSource', true))

		const { headerName } = payload
		const { data }       = await axios.put(
			`/api/v1/administration/source/${headerName}`,
			payload
		)

		toast.success(data.message)

		dispatch(setAsyncState('isSubmittingSource', false))
	}
}

export function asyncRemoveSource (headerName) {
	return async dispatch => {
		dispatch(setAsyncState('isRemovingSource', true))

		await axios.delete(`/api/v1/administration/source/${headerName}`)

		toast.success('Source deleted')

		dispatch(setAsyncState('isRemovingSource', false))
	}
}
