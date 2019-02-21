import React, { Component, Fragment } from 'react'
import moment from 'moment'
import { List } from 'immutable'
import { connect } from 'react-redux'

import { cleanLogs } from '/routes/devices/actions'

class Logs extends Component {
	shouldComponentUpdate (nextProps) {
		return this.props.logs.get(this.props.deviceId) !== nextProps.logs.get(this.props.deviceId)
	}

	getIconForType (type) {
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
		if (this.props.logs.isEmpty()) {
			return (
				<span className="card-message">
					<span className="fas fa-broom" /> No output
				</span>
			)
		} else {
			return this.props.logs
				.reverse()
				.filter(log => {
					return log.get('message')
				})
				.map((log, index) => {
					return (
						<li key={`logs${this.props.deviceId}${index}`} className="p-1">
							{this.getIconForType(log.get('type'))}

							<span className="pl-2">
								{moment(log.get('time')).format('HH:mm:ss')} <b>-</b> {log.get('message')}
							</span>
						</li>
					)
				})
		}
	}

	render () {
		const isLogsEmpty = this.props.logs.isEmpty()

		return (
			<Fragment>
				<button
					className="btn btn-warning btn-sm btn--icon float-right"
					onClick={this.onCleanLogs}
					disabled={isLogsEmpty}
					title={isLogsEmpty ? 'Nothing to clean' : 'Clean'}
				>
					<span className="fas fa-broom" />
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
	(state, ownProps) => {
		return {
			logs: state.getIn(['devicesLogs', ownProps.deviceId, 'self'], List()),
		}
	},
	{ cleanLogs }
)(Logs)
