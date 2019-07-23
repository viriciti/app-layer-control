import React, { Component, Fragment } from 'react'
import classNames from 'classnames'
import naturalCompare from 'natural-compare-lite'
import { List } from 'immutable'
import { connect } from 'react-redux'
import { partial, defaultTo } from 'lodash'

import Application from './Application'

function ApplicationStatus ({ status }) {
	switch (status) {
		case 'running':
			return <span className="fas fa-play-circle text-success mr-2" />

		case 'restarting':
			return <span className="fas fa-dot-circle text-warning mr-2" />

		case 'exited':
			return <span className="fas fa-stop-circle text-danger mr-2" />

		case 'created':
			return <span className="fas fa-circle-notch text-info mr-2" />

		default:
			return (
				<span
					className="fas fa-question-circle text-secondary mr-2"
					title={status}
				/>
			)
	}
}

function ApplicationHeader ({
	container,
	selectedContainer,
	onSelectContainer,
}) {
	const isSelected = container.get('name') === selectedContainer
	const group      = container.getIn(['labels', 'group'], 'manual')
	const version    = container
		.get('image')
		.substring(container.get('image').lastIndexOf(':') + 1)

	return (
		<li className="mb-2">
			<div className="btn-group">
				<button
					onClick={onSelectContainer}
					className={classNames('btn', 'btn--select', { active: isSelected })}
				>
					<ApplicationStatus status={container.getIn(['state', 'status'])} />
					{container.get('name')}
					<b>@</b>
					{version}
				</button>

				<div className={classNames('btn', 'btn--static', 'btn-light')}>
					{group}
				</div>
			</div>
		</li>
	)
}

class Applications extends Component {
	state = {
		selectedContainer: null,
	}

	shouldComponentUpdate (nextProps, nextState) {
		return (
			this.state.selectedContainer !== nextState.selectedContainer ||
			this.props.containers !== nextProps.containers
		)
	}

	onContainerSelected = selectedContainer => {
		if (selectedContainer.equals(this.state.selectedContainer)) {
			this.setState({ selectedContainer: null })
		} else {
			this.setState({ selectedContainer })
		}
	}

	renderContainerIcon (containerStatus) {
		switch (containerStatus) {
			case 'running':
				return <span className="fas fa-play-circle text-success" />

			case 'restarting':
				return <span className="fas fa-dot-circle text-warning" />

			case 'exited':
				return <span className="fas fa-stop-circle text-danger" />

			case 'created':
				return <span className="fas fa-circle-notch text-info" />

			default:
				return <span className="fas fa-question-circle text-secondary" />
		}
	}

	renderContainerHeader (container) {
		return `${container.get('name')} - ${container.getIn(
			['labels', 'group'],
			'manual'
		)}`
	}

	renderFrontEndButton ({ frontEndPort, deviceIp }) {
		const className = 'btn btn-secondary btn--reset-icon float-right'
		const child     = (
			<Fragment>
				Go to
				<span className="fas fa-paper-plane pl-2" />
			</Fragment>
		)

		if (deviceIp) {
			return (
				<a
					className={className}
					href={`http://${deviceIp}:${frontEndPort}`}
					rel="noopener noreferrer"
					target="_blank"
				>
					{child}
				</a>
			)
		} else {
			return (
				<button
					className={className}
					title="Apps with a front end can only be served over VPN"
					disabled
				>
					{child}
				</button>
			)
		}
	}

	render () {
		return (
			<div>
				<h5>
					<span className="fas fa-window-restore pr-1" /> Apps
				</h5>

				<hr />

				<div className="row">
					<div className="col-md-6">
						<ul className="list-group">
							{defaultTo(this.props.containers, List())
								.toList()
								.sort((previous, next) =>
									naturalCompare(previous.get('name'), next.get('name'))
								)
								.map(container => {
									const selectedContainer =
										this.state.selectedContainer &&
										this.state.selectedContainer.get('name')
									const frontEndPort      = this.props.configurations.getIn([
										container.get('name'),
										'frontEndPort',
									])
									const deviceIp          = this.props.selectedDevice.getIn(
										['systemInfo', 'tun0'],
										this.props.selectedDevice.getIn(['systemInfo', 'tun0IP'])
									)

									return (
										<ApplicationHeader
											key={container.get('Id')}
											container={container}
											selectedContainer={selectedContainer}
											onSelectContainer={partial(
												this.onContainerSelected,
												container
											)}
										/>
									)
								})}
						</ul>
					</div>
					<div className="col-md-6">
						<div className="row">
							<div className="col-12">
								{this.state.selectedContainer ? (
									<Application
										selectedContainer={this.state.selectedContainer}
										deviceId={this.props.selectedDevice.get('deviceId')}
									/>
								) : (
									<span className="card-message">No application selected</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default connect(state => {
	return {
		configurations: state.get('configurations'),
	}
})(Applications)
