import React, { Component, Fragment } from 'react'
import classNames from 'classnames'
import naturalCompare from 'natural-compare-lite'
import { List } from 'immutable'
import { connect } from 'react-redux'
import { partial, defaultTo } from 'lodash'
import Mustache from 'mustache'

import Application from './Application'
import getAsyncState from '/store/selectors/getAsyncState'

function Navigate ({ navigatePort, host, urlTemplate, device }) {
	const className = 'btn btn-secondary btn--reset-icon float-right'
	const child     = (
		<Fragment>
			Go to
			<span className="fad fa-external-link-alt pl-2" />
		</Fragment>
	)

	if (urlTemplate) {
		const url = Mustache.render(urlTemplate, device.toJS())
		return (
			<a
				className={className}
				href={url}
				rel="noopener noreferrer"
				target="_blank"
			>
				{child}
			</a>
		)
	}

	if (host) {
		return (
			<a
				className={className}
				href={['http://', host, ':', navigatePort].join('')}
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
			return <span className="fas fa-question-circle text-secondary mr-2" title={status} />
	}
}

function ApplicationHeader ({
	container,
	device,
	navigatePort,
	urlTemplate,
	onSelectContainer,
	selectedContainer,
}) {
	const isSelected = container.get('name') === selectedContainer
	const group      = container.getIn(['labels', 'group'], 'manual')
	const version    = container.get('image').substring(container.get('image').lastIndexOf(':') + 1)
	const host       = device.getIn(['systemInfo', 'tun0'], device.getIn(['systemInfo', 'tun0IP']))

	return (
		<li className="mb-2">
			<div className="btn-group">
				<button
					onClick={onSelectContainer}
					className={classNames('btn', 'btn--select', { active: isSelected })}
				>
					<ApplicationStatus status={container.getIn(['state', 'status'])} />
					{container.get('name')}

					<div className="application-version">
						<b>@</b>
						{version}
					</div>
				</button>

				<div className={classNames('btn', 'btn--static', 'btn-light')}>{group}</div>
			</div>

			{navigatePort || urlTemplate ? (
				<div className="float-right">
					<Navigate navigatePort={navigatePort} host={host} urlTemplate={urlTemplate} device={device} />
				</div>
			) : null}
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
			this.props.containers !== nextProps.containers ||
			this.props.isFetchingDevice !== nextProps.isFetchingDevice
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
		return `${container.get('name')} - ${container.getIn(['labels', 'group'], 'manual')}`
	}

	render () {
		return (
			<div>
				<h5>
					<span className="fad fa-window pr-1" /> Apps
				</h5>

				<hr />

				<div className="row">
					{this.props.isFetchingDevice ? (
						<div className="col-12">
							<div className="loader" />
						</div>
					) : (
						<Fragment>
							<div className="col-md-5">
								<ul className="list-group">
									{defaultTo(this.props.containers, List())
										.toList()
										.sort((previous, next) =>
											naturalCompare(previous.get('name'), next.get('name'))
										)
										.map(container => {
											const groupName = container.getIn(['labels', 'group'], 'manual')

											let groupApps = this.props.groups.get(groupName)

											let config

											if(groupApps) {
												config = this.props.configurations
													.filter((v, k) => groupApps.get(k))
													.find((value) => value.get("containerName") === container.get("name"))
											}

											const selectedContainer =
												this.state.selectedContainer && this.state.selectedContainer.get('name')

											const navigatePort      = config ? config.get("frontEndPort") : this.props.configurations.getIn([
												container.get('name'),
												'frontEndPort',
											])

											const urlTemplate      = config ? config.get("urlTemplate") : this.props.configurations.getIn([
												container.get('name'),
												'urlTemplate',
											])

											return (
												<ApplicationHeader
													key={container.get('Id')}
													container={container}
													device={this.props.selectedDevice}
													urlTemplate={urlTemplate}
													navigatePort={navigatePort}
													selectedContainer={selectedContainer}
													onSelectContainer={partial(this.onContainerSelected, container)}
												/>
											)
										})}
								</ul>
							</div>
							<div className="col-md-7">
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
						</Fragment>
					)}
				</div>
			</div>
		)
	}
}

export default connect((state, ownProps) => {
	const deviceId = ownProps.selectedDevice.get('deviceId')

	return {
		groups:           state.get('groups'),
		configurations:   state.get('configurations'),
		isFetchingDevice: getAsyncState(['isFetchingDevice', deviceId])(state),
	}
})(Applications)
