import React, { PureComponent, Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import Convert from 'ansi-to-html'

import { removeContainer, restartContainer, getContainerLogs } from '../../../modules/actions/index'

const convert = new Convert()

class ContainerOverview extends PureComponent {
	state = {
		numOfRequestedLogs: '',
	}

	onRestartButtonClick = () => {
		const { deviceId, restartContainer } = this.props

		if (confirm('The app will be restarted. Are you sure?')) {
			restartContainer({
				dest:    deviceId,
				payload: { id: this.props.selectedContainer.get('name') },
			})
		}
	}

	onDeleteButtonClick = () => {
		const { selectedContainer, deviceId, removeContainer } = this.props

		if (confirm('The app will be deleted. Are you sure?')) {
			removeContainer({
				dest:    deviceId,
				payload: { id: selectedContainer.get('name') },
			})
		}
	}

	requestContainerLogs = e => {
		const { selectedContainer, deviceId, getContainerLogs } = this.props

		if (e.keyCode === 13) {
			e.preventDefault()

			getContainerLogs({
				dest:    deviceId,
				payload: {
					id:        selectedContainer.get('name'),
					numOfLogs: this.state.numOfRequestedLogs,
				},
			})

			this.setState({ numOfRequestedLogs: '' })
		}
	}

	onNumOfLogsInputChange = ({ target: { value } }) => {
		if (value.match(/^[0-9]*$/)) {
			this.setState({ numOfRequestedLogs: value })
		}
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

	renderLogRequestForm () {
		return (
			<form>
				<div className="form-group">
					<label className="col-form-label" htmlFor="number-of-logs">
						Lines of logs to request
					</label>
					<input
						name="number-of-logs"
						type="text"
						placeholder="100"
						min={1}
						max={100}
						value={this.state.numOfRequestedLogs}
						className="form-control input-md"
						onKeyDown={this.requestContainerLogs}
						onChange={this.onNumOfLogsInputChange}
					/>

					<p className="help-block">Max. 100 lines</p>
				</div>
			</form>
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
						overflow:        'scroll',
						height:          '20em',
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
					onClick={this.onRestartButtonClick}
					title="Restart this app"
				>
					Restart
				</button>
				<button
					className="btn btn-danger btn-sm"
					type="button"
					onClick={this.onDeleteButtonClick}
					title="Delete this app"
				>
					Delete
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
					<div className="col-6">{this.renderLogRequestForm()}</div>
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
