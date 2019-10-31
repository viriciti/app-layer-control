import WebSocket from '/store/WebSocket'

export default ({ dispatch }) => {
	const protocol = window.location.protocol.startsWith('https') ? 'wss' : 'ws'
	const ws       = new WebSocket(`${protocol}://${window.location.host}`)

	ws.addEventListener('message', ({ data: message }) => {
		try {
			const json             = JSON.parse(message)
			const { action, data } = json

			if (!action) {
				throw new Error('No action found in WebSocket message:')
			}

			dispatch({ type: action, payload: data })
		} catch (error) {
			console.error(error.message)
		}
	})

	return next => action => next(action)
}
