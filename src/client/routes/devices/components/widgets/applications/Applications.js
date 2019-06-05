import React, { Component, Fragment } from 'react'
import classNames from 'classnames'
import naturalCompare from 'natural-compare-lite'
import { List } from 'immutable'
import { connect } from 'react-redux'
import { partial, defaultTo } from 'lodash'

import Application from './Application'

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
										<li className="mb-2" key={`${container.get('Id')}`}>
											<button
												onClick={partial(this.onContainerSelected, container)}
												className={classNames('btn', 'btn--select', {
													active: container.get('name') === selectedContainer,
												})}
											>
												{this.renderContainerIcon(
													container.getIn(['state', 'status'])
												)}
												{this.renderContainerHeader(container)}
											</button>

											{frontEndPort
												? this.renderFrontEndButton({ frontEndPort, deviceIp })
												: null}
										</li>
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
