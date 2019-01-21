import React, { PureComponent, Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import Convert from 'ansi-to-html'
import { Map } from 'immutable'
import { first } from 'lodash'

import { removeContainer, restartContainer, getContainerLogs } from '/routes/devices/modules/actions/index'

const convert = new Convert()

class ContainerOverview extends PureComponent {
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
		this.props.getContainerLogs({
			dest:    this.props.deviceId,
			payload: {
				id:        this.props.selectedContainer.get('name'),
				numOfLogs: 100,
			},
		})
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
		const { selectedContainer, devices, deviceId } = this.props
		const logs = devices.getIn([deviceId, 'containerLogs', selectedContainer.get('name')])
		const render = data => {
			return (
				<div
					style={{
						backgroundColor: '#282828',
						color:           '#FFF',
						height:          '20em',
						overflow:        'scroll',
					}}
				>
					{data.map((l, i) => {
						return <div key={`container-log-${i}`} dangerouslySetInnerHTML={{ __html: convert.toHtml(l) }} />
					})}
				</div>
			)
		}

		if (Map.isMap(logs)) {
			if (logs.get('status').toLowerCase() === 'error') {
				return (
					<p className="text-danger">
						<span className="fas fa-exclamation-triangle" /> {logs.get('data')}
					</p>
				)
			} else {
				return render(logs.get('data'))
			}
		} else {
			if (logs) {
				return render(logs)
			}
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
							<button
								className="btn btn-light btn-sm btn--icon"
								type="button"
								onClick={this.onRequestContainerLogs}
								title="Request container logs"
							>
								<span className="fas fa-file-alt" /> Logs
							</button>

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
							title="Delete this app"
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
	state => {
		return {
			devices: state.get('devices'),
		}
	},
	{ removeContainer, restartContainer, getContainerLogs }
)(ContainerOverview)
