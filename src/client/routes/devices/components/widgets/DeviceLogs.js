import React, { Component, Fragment } from 'react'
import moment from 'moment'
import { List } from 'immutable'
import { connect } from 'react-redux'

import { cleanLogs } from '/routes/devices/modules/actions'

class DeviceLogs extends Component {
	shouldComponentUpdate (nextProps) {
		return this.props.logs.get(this.props.deviceId) !== nextProps.logs.get(this.props.deviceId)
	}

	getIcon (type) {
		if (type === 'error') {
			return <span className="fas fa-exclamation-circle fa-fw text-danger" />
		} else if (type === 'warning') {
			return <span className="fas fa-exclamation-triangle fa-fw text-warning" />
		} else {
			return <span className="fas fa-info fa-fw text-info" />
		}
	}

	onCleanLogs = () => {
		this.props.cleanLogs(this.props.deviceId)
	}

	renderLogs () {
		const logs = this.props.logs.get(this.props.deviceId, List())

		if (logs.isEmpty()) {
			return <span className="card-message">No output</span>
		} else {
			return logs
				.reverse()
				.filter(log => {
					return log.get('message')
				})
				.map((log, index) => {
					return (
						<li key={`logs${this.props.deviceId}${index}`} className="p-1">
							{this.getIcon(log.get('type'))}

							<span className="pl-2">
								{moment(log.get('time')).format('HH:mm:ss')} <b>-</b> {log.get('message')}
							</span>
						</li>
					)
				})
		}
	}

	render () {
		const isLogsEmpty = this.props.logs.get(this.props.deviceId, List()).isEmpty()

		return (
			<Fragment>
				<button
					className="btn btn-danger btn-sm btn--icon float-right"
					onClick={this.onCleanLogs}
					disabled={isLogsEmpty}
					title={isLogsEmpty ? 'Nothing to clean' : 'Clean'}
				>
					<span className="fas fa-trash" />
				</button>

				<h5>
					<span className="fas fa-book pr-1" /> Logs
				</h5>

				<hr />

				<ul className="scroll-container list list--striped" style={{ height: '51vh' }}>
					{this.renderLogs()}
				</ul>
			</Fragment>
		)
	}
}

export default connect(
	state => {
		return {
			logs: state.get('devicesLogs'),
		}
	},
	{ cleanLogs }
)(DeviceLogs)
