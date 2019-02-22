import React from 'react'
import moment from 'moment'
import { List } from 'immutable'
import classNames from 'classnames'

import LastSeenInterval from '/components/common/LastSeenInterval'

const formats = {
	default: ({ value, title }) => {
		if (List.isList(value)) {
			value = value.join(', ')
		}

		return (
			<span onClick={e => e.stopPropagation()} title={title}>
				{value}
			</span>
		)
	},

	updateState: ({ value, title }) => {
		if (value.match(/error/i)) {
			return (
				<span className="text-danger" title={title}>
					<span className="fas fa-exclamation-circle pr-2" /> {value}
				</span>
			)
		} else if (value.match(/updating/i)) {
			return (
				<span className="text-info" title={title}>
					<span className="fas fa-cloud-download-alt pr-2 pulsate" /> {value}
				</span>
			)
		} else {
			return <span>{value}</span>
		}
	},

	fromNow: ({ value, info }) => {
		if (value > 1e5) {
			const title = moment(value).format('ddd MMM d - HH:mm')

			return (
				<LastSeenInterval
					startFrom={value}
					updateComponent={() => (
						<span key={info.get('deviceId')} title={title}>
							{moment(value).fromNow()}
						</span>
					)}
				/>
			)
		}
	},

	alerts: ({ value }) => {
		if (value && value.size) {
			return value
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

	status: ({ info }) => {
		const defaultClassName = classNames('fas', 'ml-3', 'd-block')

		if (info.get('connected')) {
			return <span className={classNames(defaultClassName, 'fa-circle', 'text-success')} title="Online" />
		} else {
			return <span className={classNames(defaultClassName, 'fa-circle', 'text-danger')} title="Offline" />
		}
	},
}

export default format => {
	const formatter = formats[format]
	if (!formatter) {
		throw new Error(`Format '${format}' not found`)
	}

	return formatter
}
