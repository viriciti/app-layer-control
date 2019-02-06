import React, { PureComponent, Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import Convert from 'ansi-to-html'
import { List } from 'immutable'
import { first } from 'lodash'

import AsyncButton from '/components/common/AsyncButton'
import getAsyncState from '/routes/devices/modules/selectors/getAsyncState'
import { asyncRemoveApplication, asyncRestartApplication, fetchApplicationLogs } from '/routes/devices/modules/actions'
import toReactKey from '/utils/toReactKey'

const convert = new Convert()

class Application extends PureComponent {
	protectEnvironmentVariables (variables) {
		return variables.map(variable => {
			return first(variable.split('='))
		})
	}

	onRestart = () => {
		this.props.asyncRestartApplication(this.props.deviceId, this.props.selectedContainer.get('name'))
	}

	onRemove = () => {
		this.props.asyncRemoveApplication(this.props.deviceId, this.props.selectedContainer.get('name'))
	}

	onRequestContainerLogs = () => {
		this.props.fetchApplicationLogs(this.props.deviceId, this.props.selectedContainer.get('name'))
	}

	renderContainerInfo () {
		const environmentVariables = this.props.selectedContainer.get('environment').toJS()
		const informationToShow = Object.assign({}, this.props.selectedContainer.toJS(), {
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
		console.log(this.props.isRestartingApplication)
		return (
			<Fragment>
				<div className="row">
					<div className="col-6">
						<h5>{this.props.selectedContainer.get('name')}</h5>
					</div>
					<div className="col-6">
						<div className="btn-group float-right">
							<AsyncButton
								busy={this.props.isFetchingLogs}
								busyText="Fetching ..."
								className="btn btn-light btn-sm btn--icon"
								type="button"
								onClick={this.onRequestContainerLogs}
								title="Request container logs"
							>
								<span className="fas fa-file-alt" /> Logs
							</AsyncButton>

							<AsyncButton
								busy={this.props.isRestartingApplication}
								busyText="Restarting ..."
								className="btn btn-warning btn-sm btn--icon"
								type="button"
								onClick={this.onRestart}
								title="Restart this app"
							>
								<span className="fas fa-power-off" /> Restart
							</AsyncButton>
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-12">{this.renderContainerLogs()}</div>
				</div>
				<div className="row">
					<div className="col-12">{this.renderContainerInfo()}</div>
				</div>
				<div className="row">
					<div className="col-3 offset-9">
						<AsyncButton
							busy={this.props.isRemovingApplication}
							busyText="Deleting ..."
							className="btn btn-danger btn--icon btn-sm float-right"
							type="button"
							onClick={this.onRemove}
							title="Delete this application"
						>
							<span className="fas fa-trash" /> Delete
						</AsyncButton>
					</div>
				</div>
			</Fragment>
		)
	}
}

export default connect(
	(state, ownProps) => {
		const name = ownProps.selectedContainer.get('name')

		return {
			applicationLogs:         state.getIn(['devicesLogs', ownProps.deviceId, 'containers', name], List()),
			isFetchingLogs:          getAsyncState('isFetchingLogs')(state).includes(name),
			isRestartingApplication: getAsyncState('isRestartingApplication')(state).includes(name),
			isRemovingApplication:   getAsyncState('isRemovingApplication')(state).includes(name),
		}
	},
	{ asyncRemoveApplication, asyncRestartApplication, fetchApplicationLogs }
)(Application)
