import React, { PureComponent, Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import Convert from 'ansi-to-html'
import { List } from 'immutable'
import { first, partial } from 'lodash'

import AsyncButton from '/components/common/AsyncButton'
import {
	asyncRemoveApplication,
	asyncRestartApplication,
	asyncStopApplication,
	fetchApplicationLogs,
} from '/routes/devices/actions'
import toReactKey from '/utils/toReactKey'
import getAsyncState from '/store/selectors/getAsyncState'

const convert = new Convert()

class Application extends PureComponent {
	protectEnvironmentVariables (variables) {
		return variables.map(variable => {
			return first(variable.split('='))
		})
	}

	onStop = () => {
		if (confirm('Stop this application?')) {
			this.props.asyncStopApplication(this.props.deviceId, this.props.selectedContainer.get('name'))
		}
	}

	onRestart = type => {
		const message = type === 'restart' ? 'Restart this application?' : 'Start this application?'

		if (confirm(message)) {
			this.props.asyncRestartApplication(
				this.props.deviceId,
				this.props.selectedContainer.get('name')
			)
		}
	}

	onRemove = () => {
		if (confirm('Are you sure you want to remove this application?')) {
			this.props.asyncRemoveApplication(
				this.props.deviceId,
				this.props.selectedContainer.get('name')
			)
		}
	}

	onRequestContainerLogs = () => {
		this.props.fetchApplicationLogs(this.props.deviceId, this.props.selectedContainer.get('name'))
	}

	renderContainerInfo () {
		const environmentVariables = this.props.selectedContainer.get('environment').toJS()
		const informationToShow    = Object.assign({}, this.props.selectedContainer.toJS(), {
			environment: this.protectEnvironmentVariables(environmentVariables),
		})

		return (
			<JSONPretty
				id="json-pretty"
				style={{
					overflowY: 'auto',
					maxHeight: '20em',
				}}
				json={informationToShow}
			/>
		)
	}

	renderContainerLogs () {
		if (!this.props.applicationLogs.isEmpty()) {
			return (
				<ul className="list-unstyled application-logs mb-3">
					{this.props.applicationLogs.map((message, index) => (
						<li
							key={toReactKey('applicationLog', index)}
							dangerouslySetInnerHTML={{ __html: convert.toHtml(message) }}
						/>
					))}
				</ul>
			)
		}
	}

	render () {
		const status      = this.props.selectedContainer.getIn(['state', 'status'])
		const isStartable = ['exited', 'dead', 'created'].includes(status)
		const isStoppable = status === 'running'

		return (
			<Fragment>
				<div className="row">
					<div className="col-12">
						<h5>{this.props.selectedContainer.get('name')}</h5>
					</div>
				</div>
				<div className="row">
					<div className="col-12">{this.renderContainerLogs()}</div>
				</div>
				<div className="row">
					<div className="col-12">{this.renderContainerInfo()}</div>
				</div>
				<div className="row">
					<div className="col-12">
						<div className="btn-group float-right">
							<AsyncButton
								busy={this.props.isFetchingLogs}
								className="btn btn-light btn-sm btn--icon"
								type="button"
								onClick={this.onRequestContainerLogs}
								title="Request application logs"
							>
								<span className="fas fa-file-alt" /> Logs
							</AsyncButton>

							{isStartable ? (
								<AsyncButton
									busy={this.props.isRestartingApplication}
									className="btn btn-light btn-sm btn--icon"
									type="button"
									onClick={partial(this.onRestart, 'start')}
									title="Start this application"
								>
									<span className="fas fa-play" /> Start
								</AsyncButton>
							) : (
								<AsyncButton
									busy={this.props.isRestartingApplication}
									className="btn btn-light btn-sm btn--icon"
									type="button"
									onClick={partial(this.onRestart, 'restart')}
									title="Restart this application"
								>
									<span className="fas fa-power-off" /> Restart
								</AsyncButton>
							)}

							{isStoppable ? (
								<AsyncButton
									busy={this.props.isStoppingApplication}
									className="btn btn-warning btn-sm btn--icon"
									type="button"
									onClick={this.onStop}
									title="Stop this application"
								>
									<span className="fas fa-stop" /> Stop
								</AsyncButton>
							) : null}

							<AsyncButton
								busy={this.props.isRemovingApplication}
								className="btn btn-danger btn--icon btn-sm float-right"
								type="button"
								onClick={this.onRemove}
								title="Delete this application"
							>
								<span className="fas fa-trash" />
							</AsyncButton>
						</div>
					</div>
				</div>
			</Fragment>
		)
	}
}

export default connect(
	(state, ownProps) => {
		const { deviceId } = ownProps
		const name         = ownProps.selectedContainer.get('name')

		return {
			applicationLogs:         state.getIn(['devicesLogs', deviceId, 'containers', name], List()),
			isRestartingApplication: getAsyncState(['isRestartingApplication', deviceId, name])(state),
			isRemovingApplication:   getAsyncState(['isRemovingApplication', deviceId, name])(state),
			isStoppingApplication:   getAsyncState(['isStoppingApplication', deviceId, name])(state),
			isFetchingLogs:          getAsyncState(['isFetchingLogs', deviceId, name])(state),
		}
	},
	{ asyncRemoveApplication, asyncRestartApplication, asyncStopApplication, fetchApplicationLogs }
)(Application)
