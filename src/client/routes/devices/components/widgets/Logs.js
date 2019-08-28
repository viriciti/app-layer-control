import React, { PureComponent, Fragment } from 'react'
import moment from 'moment'
import { List } from 'immutable'
import { connect } from 'react-redux'

import { cleanLogs } from '/routes/devices/actions'
import toReactKey from '/utils/toReactKey'

class Logs extends PureComponent {
	getIconForType (type) {
		if (type === 'error') {
			return <span className="fas fa-exclamation-circle fa-fw text-danger" />
		} else if (type === 'warning') {
			return <span className="fas fa-exclamation-triangle fa-fw text-warning" />
		} else {
			return <span className="fas fa-info fa-fw text-info" />
		}
	}

	onClearLogs = () => {
		this.props.cleanLogs(this.props.deviceId)
	}

	renderLogs () {
		if (this.props.logs.isEmpty()) {
			return <span className="card-message card-message--small">No recent activity</span>
		} else {
			return this.props.logs
				.reverse()
				.filter(log => log.get('message'))
				.map((log, index) => (
					<li key={toReactKey('logs', this.props.deviceId, index)} className="p-1">
						{this.getIconForType(log.get('type'))}

						<span className="pl-2">
							{moment(log.get('time')).format('HH:mm:ss')} <b>-</b> {log.get('message')}
						</span>
					</li>
				))
		}
	}

	render () {
		const isLogsEmpty = this.props.logs.isEmpty()

		return (
			<Fragment>
				<button
					className="btn btn-warning btn-sm btn--icon float-right"
					onClick={this.onClearLogs}
					disabled={isLogsEmpty}
					title={isLogsEmpty ? 'Nothing to clear' : 'Clear'}
				>
					<span className="fad fa-trash" />
				</button>

				<h5>
					<span className="fad fa-comment-alt-lines pr-1" /> Logs
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
	(state, ownProps) => ({
		logs: state.getIn(['devicesLogs', ownProps.deviceId, 'self'], List()),
	}),
	{ cleanLogs }
)(Logs)
