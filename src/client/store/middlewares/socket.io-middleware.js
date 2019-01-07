import io from 'socket.io-client'
import camelCase from 'camel-case'
import { toast } from 'react-toastify'

import { updateAsyncState, updateDeviceAsyncState } from '/store/globalReducers/userInterface'

const socket = io(window.location.origin)

export default function ({ dispatch }) {
	const notify = (type, ...message) => {
		toast(message.join(' '), { type })
	}

	const _handleActionsToDevices = (action, next) => {
		const { payload, dest } = action.payload

		const actionToDispatch = {
			action: camelCase(action.type.split('/')[1]),
			payload,
			dest,
		}

		socket.emit('action:devices', actionToDispatch, error => {
			if (error) {
				return notify('error', error.message)
			}

			notify('success', `✓ Action executed correctly on ${dest.length} devices`)
		})

		return next(action)
	}

	const _handleActionsToDb = (action, next) => {
		const actionToDispatch = {
			action:  camelCase(action.type.split('/')[1]),
			payload: action.payload,
			meta:    action.meta,
		}

		if (action.meta && action.meta.async) {
			dispatch(updateAsyncState(action.meta.async, true))
		}

		socket.emit('action:db', actionToDispatch, (error, message) => {
			const { meta } = actionToDispatch

			if (meta && meta.async) {
				dispatch(updateAsyncState(meta.async, false))
			}

			if (error) {
				return notify('error', error.message)
			}

			notify('success', `✓ ${message}`)
		})

		return next(action)
	}

	const _handleActionsToDevice = (action, next) => {
		const { payload, dest } = action.payload

		const actionToDispatch = {
			action: camelCase(action.type.split('/')[1]),
			payload,
			dest,
		}

		if (action.meta && action.meta.async) {
			dispatch(updateDeviceAsyncState(action.meta.async, [dest], true))
		}

		socket.emit('action:device', actionToDispatch, (error, message) => {
			if (action.meta && action.meta.async) {
				dispatch(updateDeviceAsyncState(action.meta.async, [dest], false))
			}

			if (error) {
				return notify('error', error.message)
			}

			notify('success', `✓ ${message}`)
		})

		return next(action)
	}

	const _handleGetActionsToDevice = (action, next) => {
		const { payload, dest } = action.payload

		const actionToDispatch = {
			action: camelCase(action.type.split('/')[1]),
			payload,
			dest,
		}

		if (action.meta && action.meta.async) {
			dispatch(updateDeviceAsyncState(action.meta.async, [dest], true))
		}

		socket.emit('action:device:get', actionToDispatch, (error, result) => {
			if (action.meta && action.meta.async) {
				dispatch(updateDeviceAsyncState(action.meta.async, [dest], false))
			}

			if (error) {
				return notify('error', error.message || error.data)
			}

			if (actionToDispatch.action === 'getContainerLogs') {
				dispatch({
					type: 'CONTAINER_LOGS',
					data: {
						logs:        result.data,
						device:      actionToDispatch.dest,
						containerId: actionToDispatch.payload.id,
					},
				})
			}
		})

		return next(action)
	}

	socket.on('action', action => {
		dispatch(action)
	})

	return next => {
		return action => {
			const { type } = action

			if (type.indexOf('device/') > -1) {
				return _handleActionsToDevice(action, next)
			} else if (type.indexOf('device:get/') > -1) {
				return _handleGetActionsToDevice(action, next)
			} else if (type.indexOf('db/') > -1) {
				return _handleActionsToDb(action, next)
			} else if (type.indexOf('devices/') > -1) {
				return _handleActionsToDevices(action, next)
			}

			next(action)
		}
	}
}
