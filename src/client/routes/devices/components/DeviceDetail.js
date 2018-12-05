import React, { PureComponent } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

import Modal from 'components/common/Modal'
import { refreshState, selectDevice } from 'routes/devices/modules/actions'
import getSelectedDevice from 'routes/devices/modules/selectors/getSelectedDevice'
import AsyncButton from 'components/common/AsyncButton'

import { SystemInfo, DeviceLogs, DeviceContainers, DeviceImages, DeviceGroups, Queue, FinishedQueue } from './widgets'

class DeviceDetail extends PureComponent {
	getDeviceSources () {
		return this.props.deviceSources.filter(deviceSource => {
			return deviceSource.get('entryInDetail')
		})
	}

	onRefreshState = () => {
		this.props.refreshState({
			dest: this.props.selectedDevice.get('deviceId'),
		})
	}

	renderContent = () => {
		const { selectedDevice } = this.props

		if (!selectedDevice) {
			return
		}

		const deviceId = selectedDevice.get('deviceId')
		const status = selectedDevice.get('onlineStatus', 'offline')
		const statusLabel = classNames('label', 'label--inline', 'label--no-hover', 'float-right')

		return (
			<div className="row">
				<div className="col">
					<div className="row">
						<div className="col-12">
							{this.props.selectedDevice.getIn(['updateState', 'short'], '').match(/error/i) ? (
								<div className="row">
									<div className="col-12">
										<div className="alert alert-danger">
											<span className="fas fa-exclamation-triangle mr-2" />
											{this.props.selectedDevice.getIn(['updateState', 'long'])}
										</div>
									</div>
								</div>
							) : null}
							<div className="row">
								<div className="col-lg-5 mb-4">
									<h5>
										<span className="fas fa-save pr-1" /> System
									</h5>

									<hr />

									<SystemInfo
										selectedDevice={this.props.selectedDevice}
										osVersion={this.props.osVersion}
										deviceSources={this.getDeviceSources()}
									/>
								</div>

								<div className="col-lg-4 mb-4">
									<DeviceGroups selectedDevice={this.props.selectedDevice} />
								</div>

								<div className="col-lg-3 mb-4">
									<h5>
										<span className="fas fa-sliders-h pr-1" /> Control
										{status === 'online' ? (
											<span className={classNames(statusLabel, 'label--success')}>
												<span className="fas fa-wifi" /> Online
											</span>
										) : (
											<span className={classNames(statusLabel, 'label--danger')}>
												<span className="fas fa-wifi" /> Offline
											</span>
										)}
									</h5>

									<hr />

									<AsyncButton
										className="btn btn-secondary d-block mb-1"
										onClick={this.onRefreshState}
										busy={this.props.isRefreshingState.includes(deviceId)}
										busyText="Refreshing ..."
									>
										<span className="fas fa-cloud-download-alt" /> Refresh State
									</AsyncButton>
								</div>
							</div>
						</div>
					</div>

					<div className="row">
						<div className="col-md-8">
							<div className="row">
								<div className="col-lg-12 mb-4">
									<DeviceContainers containers={selectedDevice.get('containers')} selectedDevice={selectedDevice} />
								</div>
							</div>
							<div className="row">
								<div className="col-lg-12 mb-4">
									<Queue selectedDevice={this.props.selectedDevice} />
								</div>
							</div>
							<div className="row">
								<div className="col-lg-12 mb-4">
									<FinishedQueue selectedDevice={this.props.selectedDevice} />
								</div>
							</div>
						</div>

						<div className="col-lg-4 mb-4">
							<div className="row">
								<div className="col-12">
									<DeviceLogs deviceId={deviceId} />
								</div>
							</div>
						</div>
					</div>

					<div className="row">
						<div className="col-12">
							<DeviceImages images={selectedDevice.get('images')} selectedDevice={deviceId} />
						</div>
					</div>
				</div>
			</div>
		)
	}

	render () {
		const status = this.props.selectedDevice ? this.props.selectedDevice.get('onlineStatus', 'offline') : 'offline'
		const title = this.props.selectedDevice ? `Device: ${this.props.selectedDevice.get('deviceId')}` : ''
		const headerClassName = `device-${status}`

		return (
			<Modal
				title={title}
				headerClassName={headerClassName}
				visible={this.props.open}
				onClose={() => {
					return this.props.selectDevice(null)
				}}
				wide
			>
				{this.renderContent()}
			</Modal>
		)
	}
}

export default connect(
	state => {
		return {
			selectedDevice:    getSelectedDevice(state),
			isRefreshingState: state.getIn(['userInterface', 'isRefreshingState']),
		}
	},
	{
		refreshState,
		selectDevice,
	}
)(DeviceDetail)
