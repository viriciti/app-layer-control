import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import clipboard from 'clipboard-polyfill'
import { partialRight } from 'lodash'

import formats from './table/formats'

import { selectDevice, multiSelectDevice } from '/routes/devices/modules/actions'
import toReactKey from '/utils/toReactKey'

const Clipboard = ({ onClick }) => (
	<button className="btn btn--text btn--icon btn-sm float-right" title="Copy to clipboard" onClick={onClick}>
		<span className="fas fa-clipboard" />
	</button>
)

class DeviceListItem extends PureComponent {
	onCopy = (event, value) => {
		event.stopPropagation()
		clipboard.writeText(value)
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
					.filter(options => options.get('entryInTable'))
					.map(options => {
						const getIn = options.get('getIn').split('.')
						const fallbackGetIn = options.get('fallbackGetIn', '').split('.')
						const getInTitle = options.get('getInTitle').split('.')

						const value = info.getIn(getIn, info.getIn(fallbackGetIn, options.get('defaultValue')))
						const formatter = formats(options.get('format', 'default'))
						const span = formatter(value, info.getIn(getInTitle))

						return (
							<td key={toReactKey(info.get('deviceId'), options.get('name'))}>
								{span}
								{options.get('copyable') && value ? <Clipboard onClick={partialRight(this.onCopy, value)} /> : null}
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
