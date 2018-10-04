import React, { Component, Fragment } from 'react'
import moment from 'moment'
import { List } from 'immutable'
import { connect } from 'react-redux'

import { cleanLogs } from '../../modules/actions'

const FORMAT = 'YYYY-MM-DD HH:mm:ss'

class DeviceLogs extends Component {
	shouldComponentUpdate (nextProps) {
		return this.props.logs.get(this.props.deviceId) !== nextProps.logs.get(this.props.deviceId)
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
					let className = ''
					if (log.get('type') === 'error') className = 'bg-danger'
					if (log.get('type') === 'warning') className = 'bg-warning'

					return (
						<li className={className} key={`${this.props.deviceId}-logs-${index}`}>
							<span>{moment(log.get('time')).format(FORMAT)}</span>
							<span> - </span>
							<span>{`${log.get('message')}`}</span>
						</li>
					)
				})
		}
	}

	onCleanLogs = () => {
		this.props.cleanLogs(this.props.deviceId)
	}

	render () {
		return (
			<Fragment>
				<button
					className="btn btn-danger btn-sm btn--icon float-right"
					onClick={this.onCleanLogs}
					disabled={this.props.logs.get(this.props.deviceId, List()).isEmpty()}
					title="Clean logs"
				>
					<span className="fas fa-trash" />
				</button>

				<h5>
					<span className="fas fa-book pr-1" /> Logs
				</h5>

				<hr />

				<ul className="scroll-container" style={{ height: '51vh' }}>
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
