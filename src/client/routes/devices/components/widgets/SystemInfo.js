import React, { Fragment } from 'react'

const SystemInfo = ({ selectedDevice, deviceSources }) => {
	const deviceId = selectedDevice.get('deviceId')

	return (
		<Fragment>
			{deviceSources.size ? (
				<dl className="row">
					{deviceSources.valueSeq().map(deviceSource => {
						const getIn = deviceSource.get('getIn').split('.')
						const getInTitle = deviceSource.get('getInTitle').split('.')

						return (
							<Fragment key={`${deviceId}${deviceSource.get('headerName')}`}>
								<dt className="col-md-3 text-right">{deviceSource.get('headerName')}</dt>
								<dd className="col-md-9" title={selectedDevice.getIn(getInTitle)}>
									{selectedDevice.getIn(getIn, deviceSource.get('defaultValue'))}
								</dd>
							</Fragment>
						)
					})}
				</dl>
			) : null}
		</Fragment>
	)
}

export default SystemInfo
