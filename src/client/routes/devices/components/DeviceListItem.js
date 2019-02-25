import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import clipboard from 'clipboard-polyfill'
import { partialRight } from 'lodash'
import classNames from 'classnames'

import formats from '/routes/devices/components/table/formats'
import { selectDevice, multiSelectDevice } from '/routes/devices/actions'
import toReactKey from '/utils/toReactKey'

const Clipboard = ({ onClick }) => (
	<button className="btn btn--text btn--icon btn-sm float-right" title="Copy to clipboard" onClick={onClick}>
		<span className="far fa-clipboard" />
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

	onSelectDevice = event => {
		const selection   = window
			.getSelection()
			.toString()
			.trim()
		const textContent = event.target.textContent.trim()

		if (!selection || !textContent.includes(selection)) {
			this.props.selectDevice(this.props.info.get('deviceId'))
		}
	}

	stopPropagation = event => {
		event.stopPropagation()
	}

	render () {
		const { info, deviceSources } = this.props

		return (
			<tr
				className={classNames('device-item', 'tr--cursor', {
					'table-selected': this.props.selected,
					'table-faded':    !this.props.info.has('connected'),
				})}
				onClick={this.onSelectDevice}
			>
				<td>
					<div className="custom-control custom-checkbox" onClick={this.stopPropagation}>
						<input
							className="custom-control-input"
							type="checkbox"
							onChange={this.onMultiSelect}
							checked={this.props.selected}
							id={`selectDevice${info.get('deviceId')}`}
						/>

						<label className="custom-control-label" htmlFor={`selectDevice${info.get('deviceId')}`} />
					</div>
				</td>

				{deviceSources
					.valueSeq()
					.filter(options => options.get('entryInTable'))
					.map(options => {
						const getIn         = options.get('getIn').split('.')
						const fallbackGetIn = options.get('fallbackGetIn', '').split('.')
						const getInTitle    = options.get('getInTitle').split('.')

						const value     = info.getIn(getIn, info.getIn(fallbackGetIn, options.get('defaultValue')))
						const formatter = formats(options.get('format', 'default'))
						const span      = formatter({
							value: value,
							title: info.getIn(getInTitle),
							info:  info,
						})

						return (
							<td key={toReactKey(info.get('deviceId'), options.get('headerName'))}>
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
