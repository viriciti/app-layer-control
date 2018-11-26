import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import clipboard from 'clipboard-polyfill'

import formats from './table/formats'

import { selectDevice, multiSelectDevice } from 'routes/devices/modules/actions'

class DeviceListItem extends PureComponent {
	copyToClipboardIcon = (columnName, value) => {
		const onClickCopy = e => {
			e.stopPropagation()
			clipboard.writeText(value)
		}

		return (
			<button
				className="btn btn--text btn-sm btn--icon float-right"
				title={`Copy ${columnName} to clipboard`}
				onClick={onClickCopy}
			>
				<span className="far fa-clipboard" />
			</button>
		)
	}

	onMultiSelect = () => {
		this.props.multiSelectDevice(this.props.info.get('deviceId'))
	}

	onSelectDevice = () => {
		this.props.selectDevice(this.props.info)
	}

	stopPropagation = e => {
		e.stopPropagation()
	}

	render () {
		const { info, deviceSources } = this.props

		return (
			<tr className="device-item" onClick={this.onSelectDevice}>
				<td className="table-checkbox">
					<label className="checkbox-inline">
						<input
							className="check-box"
							type="checkbox"
							onClick={this.stopPropagation}
							onChange={this.onMultiSelect}
							checked={this.props.selected}
						/>
					</label>
				</td>

				{deviceSources
					.valueSeq()
					.filter(options => {
						return options.get('entryInTable')
					})
					.map((options, index) => {
						const getIn = options.get('getIn').split('.')
						const getInTitle = options.get('getInTitle').split('.')

						const value = info.getIn(getIn, options.get('defaultValue'))
						const formatter = formats(options.get('format', 'default'))
						const span = formatter(value, info.getIn(getInTitle))

						return (
							<td position={index} key={`${info.get('deviceId')}-${index}`}>
								{span}
								{options.get('copyable') && value ? this.copyToClipboardIcon(options.get('headerName'), value) : null}
							</td>
						)
					})}
			</tr>
		)
	}
}

export default connect(
	null,
	{ selectDevice, multiSelectDevice }
)(DeviceListItem)
