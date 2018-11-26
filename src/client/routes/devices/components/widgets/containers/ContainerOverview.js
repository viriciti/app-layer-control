import React, { PureComponent, Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import Convert from 'ansi-to-html'

import { removeContainer, restartContainer, getContainerLogs } from 'routes/devices/modules/actions/index'

const convert = new Convert()

class ContainerOverview extends PureComponent {
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
		return (
			<JSONPretty
				id="json-pretty"
				style={{
					overflowY: 'auto',
					maxHeight: '20em',
				}}
				json={this.props.selectedContainer.toJS()}
			/>
		)
	}

	renderContainerLogs () {
		const { selectedContainer, devices, deviceId } = this.props
		const logs = devices.getIn([deviceId, 'containerLogs', selectedContainer.get('name')])

		if (logs) {
			return (
				<div
					style={{
						backgroundColor: '#282828',
						color:           '#FFF',
						height:          '20em',
						overflow:        'scroll',
					}}
				>
					{logs.map((l, i) => {
						return <div key={`container-log-${i}`} dangerouslySetInnerHTML={{ __html: convert.toHtml(l) }} />
					})}
				</div>
			)
		}
	}

	renderActionButtons () {
		return (
			<ul className="btn-group float-right">
				<button
					className="btn btn-light btn-sm"
					type="button"
					onClick={this.onRequestContainerLogs}
					title="Request container logs"
				>
					Logs
				</button>
				<button
					className="btn btn-light btn-sm"
					type="button"
					onClick={this.onRestartButtonClick}
					title="Restart this app"
				>
					Restart
				</button>
				<button
					className="btn btn-danger btn--icon btn-sm"
					type="button"
					onClick={this.onDeleteButtonClick}
					title="Delete this app"
				>
					<span className="fas fa-trash" />
				</button>
			</ul>
		)
	}

	render () {
		return (
			<Fragment>
				<div className="row">
					<div className="col-6">
						<h5>{this.props.selectedContainer.get('name')}</h5>
					</div>
					<div className="col-6">{this.renderActionButtons()}</div>
				</div>
				<div className="row">
					<div className="col-12">{this.renderContainerLogs()}</div>
				</div>
				<div className="row">
					<div className="col-12">{this.renderContainerInfo()}</div>
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
