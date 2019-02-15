import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { without, isEmpty, defaultTo, partial } from 'lodash'
import semver from 'semver'

import { asyncStoreGroups } from '/routes/devices/modules/actions'
import AsyncButton from '/components/common/AsyncButton'
import selectedDeviceSelector from '/routes/devices/modules/selectors/getSelectedDevice'
import getAsyncState from '/store/selectors/getAsyncState'

class AddGroupsForm extends PureComponent {
	state = {
		selectedGroups: [],
	}

	getSupport () {
		const dmVersion      = this.props.selectedDevice.getIn(['systemInfo', 'dmVersion'])
		const appVersion     = this.props.selectedDevice.getIn(['systemInfo', 'appVersion'])
		const version        = defaultTo(dmVersion, appVersion)
		const supportedSince = '1.18.0'

		if (!version) {
			return {
				current:        'unknown',
				supportedSince: supportedSince,
				supported:      false,
			}
		} else {
			return {
				current:        version,
				supportedSince: supportedSince,
				supported:      semver.gt(version, supportedSince),
			}
		}
	}

	onGroupSelected = e => {
		const group          = e.target.value
		const selectedGroups = this.state.selectedGroups

		if (!selectedGroups.includes(group)) {
			this.setState({ selectedGroups: selectedGroups.concat(group) })
		}
	}

	onGroupDeselected = group => {
		this.setState({
			selectedGroups: without(this.state.selectedGroups, group),
		})
	}

	onSubmit = e => {
		e.preventDefault()

		if (isEmpty(this.state.selectedGroups)) {
			return alert('You must select which groups you want to send')
		}

		if (!confirm('Sending groups. Are you sure?')) {
			return
		}

		this.props.asyncStoreGroups(this.props.selectedDevice.get('deviceId'), this.state.selectedGroups)
		this.setState({ selectedGroups: [] })
	}

	renderSelectedGroups = () => {
		return this.state.selectedGroups.map(group => {
			return (
				<span className="label d-inline-block m-1" style={{ border: '2px solid', borderRadius: '20px' }} key={group}>
					{group}
					<span
						className="fas fa-minus-circle font-size-sm pl-2"
						data-toggle="tooltip"
						title="Deselect"
						onClick={partial(this.onGroupDeselected, group)}
					/>
				</span>
			)
		})
	}

	renderOptions = () => {
		const placeholder = (
			<option key="group-select-placeholder" value="">
				Please select a group
			</option>
		)
		if (!this.props.groups) return placeholder

		return [placeholder].concat(
			this.props.groups
				.keySeq()
				.filter(group => {
					return group !== 'default'
				})
				.map(group => {
					return (
						<option key={group} value={group}>
							{' '}
							{group}
						</option>
					)
				})
		)
	}

	render () {
		const { supported, current, supportedSince } = this.getSupport()

		return (
			<div>
				<div className="row">
					<div className="col-12">
						<form>
							<div className="form-group">
								<label htmlFor="groups">Insert the groups from low to high priority</label>
								<select
									disabled={this.props.groups.length === 0}
									className="form-control"
									name="groups"
									onClick={this.onGroupSelected}
								>
									{this.renderOptions()}
								</select>
							</div>
							<div className="form-group">{this.renderSelectedGroups()}</div>

							{supported ? (
								<AsyncButton
									type="submit"
									className="btn btn-light"
									onClick={this.onSubmit}
									busy={this.props.isStoringGroups.includes(this.props.selectedDevice.get('deviceId'))}
									busyText="Sending ..."
								>
									Send
								</AsyncButton>
							) : (
								<p
									className="text-danger pt-2"
									title={`Supported since ${supportedSince}, currently running ${current}`}
								>
									<span className="fas fa-exclamation-circle pr-2" />
									Updating groups for this version is not supported
								</p>
							)}
						</form>
					</div>
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			selectedDevice:  selectedDeviceSelector(state),
			groups:          state.get('groups'),
			isStoringGroups: getAsyncState('isStoringGroups')(state),
		}
	},
	{ asyncStoreGroups }
)(AddGroupsForm)
