import map from 'p-map'

export default ws => {
	const endpoints = [
		// { action: 'DEVICES_STATE', url: '/api/devices' },
		// { action: 'CONFIGURATIONS', url: '/api/v1/administration/applications' },
		// { action: 'DEVICE_SOURCES', url: '/api/v1/administration/sources' },
		// { action: 'GROUPS', url: '/api/v1/administration/groups' },
		// { action: 'REGISTRY_IMAGES', url: '/api/v1/administration/registry?only=images' },
		// { action: 'ALLOWED_IMAGES', url: '/api/v1/administration/registry?only=allowed' },
	]

	return async dispatch => {
		const responses = await map(endpoints, async endpoint => {
			const response = await fetch(endpoint.url)
			const json = await response.json()

			return {
				action: endpoint.action,
				data:   json.data,
			}
		})

		responses.forEach(({ action, data }) =>
			dispatch({
				type: action,
				data: data,
			})
		)

		ws.addEventListener('message', ({ data: message }) => {
			try {
				const json = JSON.parse(message)
				const { action, data } = json

				if (!action) {
					throw new Error('No action found in WebSocket message:')
				}

				dispatch({ type: action, payload: data })
			} catch (error) {
				console.error(error.message)
			}
		})
	}
}
