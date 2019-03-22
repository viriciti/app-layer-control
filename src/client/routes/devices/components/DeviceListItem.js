import $ from 'jquery'
import * as clipboard from 'clipboard-polyfill'
import React, { useEffect, useRef } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import formats from '/routes/devices/components/table/formats'
import { selectDevice, multiSelectDevice } from '/routes/devices/actions'
import toReactKey from '/utils/toReactKey'

const Clipboard = value => {
	const ref    = useRef()
	const onCopy = event => {
		const $element = $(ref.current)

		event.stopPropagation()
		clipboard.writeText(value)

		$element.tooltip('show')
		setTimeout(() => $element.tooltip('hide'), 1250)
	}

	useEffect(() => {
		const $element = $(ref.current)
		const options  = { trigger: 'manual', html: true }
		const html     = '<span class="fas fa-clipboard-check fa-fw"></span> Copied'

		$element.attr('title', html).tooltip(options)
		return () => $element.tooltip('dispose')
	}, [])

	return (
		<button
			className="btn btn--text btn--icon btn-sm float-right"
			onClick={onCopy}
			ref={ref}
		>
			<span className="far fa-clipboard" />
		</button>
	)
}

const DeviceListItem = ({
	multiSelectDevice,
	selectDevice,
	info,
	deviceSources,
	selected,
}) => {
	const onMultiSelect  = () => multiSelectDevice(info.get('deviceId'))
	const onSelectDevice = event => {
		const textContent = event.target.textContent.trim()
		const selection   = window
			.getSelection()
			.toString()
			.trim()

		if (!selection || !textContent.includes(selection)) {
			selectDevice(info.get('deviceId'))
		}
	}
	const stopPropagation = event => event.stopPropagation()

	return (
		<tr
			className={classNames('device-item', 'tr--cursor', {
				'table-selected': selected,
				'table-faded':    !info.has('connected'),
			})}
			onClick={onSelectDevice}
		>
			<td>
				<div
					className="custom-control custom-checkbox"
					onClick={stopPropagation}
				>
					<input
						className="custom-control-input"
						type="checkbox"
						onChange={onMultiSelect}
						checked={selected}
						id={`selectDevice${info.get('deviceId')}`}
					/>

					<label
						className="custom-control-label"
						htmlFor={`selectDevice${info.get('deviceId')}`}
					/>
				</div>
			</td>

			{deviceSources
				.valueSeq()
				.filter(options => options.get('entryInTable'))
				.map(options => {
					const getIn         = options.get('getIn').split('.')
					const fallbackGetIn = options.get('fallbackGetIn', '').split('.')
					const getInTitle    = options.get('getInTitle').split('.')

					const value     = info.getIn(
						getIn,
						info.getIn(fallbackGetIn, options.get('defaultValue'))
					)
					const formatter = formats(options.get('format', 'default'))
					const span      = formatter({
						value: value,
						title: info.getIn(getInTitle),
						info:  info,
					})

					return (
						<td
							key={toReactKey(info.get('deviceId'), options.get('headerName'))}
						>
							{span}
							{options.get('copyable') && value ? (
								<Clipboard value={value} />
							) : null}
						</td>
					)
				})}
		</tr>
	)
}

export default connect(
	null,
	{ selectDevice, multiSelectDevice }
)(DeviceListItem)
