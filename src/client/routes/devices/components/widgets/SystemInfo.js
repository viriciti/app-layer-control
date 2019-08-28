import React, { Fragment } from 'react'

const SystemInfo = ({ selectedDevice, deviceSources }) => {
	const deviceId = selectedDevice.get('deviceId')

	if (!deviceSources.size) {
		return null
	} else {
		return (
			<dl className="row">
				{deviceSources.entrySeq().map(([sourceId, deviceSource]) => {
					const getIn         = deviceSource.get('getIn').split('.')
					const fallbackGetIn = deviceSource.get('fallbackGetIn', '').split('.')
					const getInTitle    = deviceSource.get('getInTitle').split('.')

					return (
						<Fragment key={`${deviceId}${sourceId}`}>
							<dt className="col-md-3 text-right">{deviceSource.get('headerName')}</dt>
							<dd className="col-md-9" title={selectedDevice.getIn(getInTitle)}>
								{selectedDevice.getIn(
									getIn,
									selectedDevice.getIn(fallbackGetIn, deviceSource.get('defaultValue'))
								)}
							</dd>
						</Fragment>
					)
				})}
			</dl>
		)
	}
}

export default SystemInfo
