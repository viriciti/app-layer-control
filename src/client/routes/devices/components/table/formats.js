import React from 'react'
import moment from 'moment'
import { List } from 'immutable'
import classNames from 'classnames'

import LastSeenInterval from '/components/common/LastSeenInterval'

const formats = {
	default: (value, title) => {
		if (List.isList(value)) {
			value = value.join(', ')
		}

		return (
			<span
				onClick={e => {
					e.stopPropagation()
				}}
				title={title}
			>
				{value}
			</span>
		)
	},

	updateState: (state, title) => {
		if (state.match(/error/i)) {
			return (
				<span className="text-danger" title={title}>
					<span className="fas fa-exclamation-circle pr-2" /> {state}
				</span>
			)
		} else if (state.match(/updating/i)) {
			return (
				<span className="text-info" title={title}>
					<span className="fas fa-cloud-download-alt pr-2" /> {state}
				</span>
			)
		} else {
			return <span>{state}</span>
		}
	},

	fromNow: lastSeen => {
		if (lastSeen > 1e5) {
			const title = moment(lastSeen).format('ddd MMM d - HH:mm')

			return (
				<LastSeenInterval
					startFrom={lastSeen}
					updateComponent={() => {
						return <span title={title}>{moment(lastSeen).fromNow()}</span>
					}}
				/>
			)
		}
	},

	alerts: alerts => {
		if (alerts && alerts.size) {
			return alerts
				.filter(body => {
					return body && body.length
				})
				.entrySeq()
				.map(([type, body]) => {
					return (
						<span
							key={type}
							className={classNames('mr-3', 'fas', 'icon', {
								'fa-download text-warning': type === 'versionsNotMatching',
								'fa-heartbeat text-danger': type === 'containersNotRunning',
							})}
							title={body}
						/>
					)
				})
		}
	},

	online: state => {
		if (state === 'online') {
			return <span className="fas fa-microchip status-icon text-success" title="Online" />
		} else {
			return <span className="fas fa-microchip status-icon text-danger" title="Offline" />
		}
	},
}

export default format => {
	const formatter = formats[format]
	if (!formatter) {
		console.error(`You pancake! No format specified for '${format}'!`)
		return formats['default']
	}

	return formatter
}
