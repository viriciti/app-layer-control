import React, { PureComponent, Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import Convert from 'ansi-to-html'
import { List } from 'immutable'
import { first } from 'lodash'

import AsyncButton from '/components/common/AsyncButton'
import fetchingLogs from '/routes/devices/modules/selectors/fetchingLogs'
import { removeContainer, restartContainer, fetchApplicationLogs } from '/routes/devices/modules/actions'
import toReactKey from '/utils/toReactKey'

const convert = new Convert()

class Application extends PureComponent {
	protectEnvironmentVariables (variables) {
		return variables.map(variable => {
			return first(variable.split('='))
		})
	}

	onRestartButtonClick = () => {
		if (confirm('The app will be restarted. Are you sure?')) {
			this.props.restartContainer({
				dest:    this.props.deviceId,
				payload: { id: this.props.selectedContainer.get('name') },
			})
		}
	}

	onDeleteButtonClick = () => {
		if (confirm('The app will be deleted. Are you sure?')) {
			this.props.removeContainer({
				dest:    this.props.deviceId,
				payload: {
					id: this.props.selectedContainer.get('name'),
				},
			})
		}
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
		return (
			<Fragment>
				<div className="row">
					<div className="col-6">
						<h5>{this.props.selectedContainer.get('name')}</h5>
					</div>
					<div className="col-6">
						<div className="btn-group float-right">
							<AsyncButton
								busy={this.props.fetchingLogs.includes(this.props.selectedContainer.get('name'))}
								busyText="Fetching ..."
								className="btn btn-light btn-sm btn--icon"
								type="button"
								onClick={this.onRequestContainerLogs}
								title="Request container logs"
							>
								<span className="fas fa-file-alt" /> Logs
							</AsyncButton>

							<button
								className="btn btn-warning btn-sm btn--icon"
								type="button"
								onClick={this.onRestartButtonClick}
								title="Restart this app"
							>
								<span className="fas fa-power-off" /> Restart
							</button>
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
						<button
							className="btn btn-danger btn--icon btn-sm float-right"
							type="button"
							onClick={this.onDeleteButtonClick}
							title="Delete this application"
						>
							<span className="fas fa-trash" /> Delete
						</button>
					</div>
				</div>
			</Fragment>
		)
	}
}

export default connect(
	(state, ownProps) => {
		return {
			applicationLogs: state.getIn(
				['devicesLogs', ownProps.deviceId, 'containers', ownProps.selectedContainer.get('name')],
				List()
			),
			fetchingLogs: fetchingLogs(state),
		}
	},
	{ removeContainer, restartContainer, fetchApplicationLogs }
)(Application)
