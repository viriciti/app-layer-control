import React, { PureComponent } from 'react'
import classNames from 'classnames'
import semver from 'semver'
import { connect } from 'react-redux'
import { without, defaultTo, partial } from 'lodash'

import { asyncStoreGroups } from '/routes/devices/actions'
import AsyncButton from '/components/common/AsyncButton'
import getAsyncState from '/store/selectors/getAsyncState'
import getSelectedDevice from '/routes/devices/selectors/getSelectedDevice'

class GroupsForm extends PureComponent {
	state = {
		selectedGroups: [],
	}

	getSupport () {
		const dmVersion      = this.props.selectedDevice.getIn([
			'systemInfo',
			'dmVersion',
		])
		const appVersion     = this.props.selectedDevice.getIn([
			'systemInfo',
			'appVersion',
		])
		const version        = defaultTo(appVersion, dmVersion)
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
			this.props.onTouch()
			this.setState({ selectedGroups: selectedGroups.concat(group) })
		}
	}

	onGroupDeselected = group => {
		this.props.onTouch()
		this.setState({
			selectedGroups: without(this.state.selectedGroups, group),
		})
	}

	onSubmit = e => {
		e.preventDefault()

		if (!confirm('Save groups for this device?')) {
			return
		}

		this.props.asyncStoreGroups(
			this.props.selectedDevice.get('deviceId'),
			this.props.inGroups.toArray().concat(this.state.selectedGroups)
		)
		this.setState({ selectedGroups: [] })
	}

	renderSelectedGroups = () => {
		return this.state.selectedGroups.map(group => {
			return (
				<span
					className="label d-inline-block m-1"
					style={{ border: '2px solid', borderRadius: '20px' }}
					key={group}
				>
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
		const currentGroups = this.props.inGroups.toArray()
		const placeholder   = (
			<option key="group-select-placeholder" value="">
				Please select a group
			</option>
		)

		if (!this.props.groups) {
			return placeholder
		}

		return [placeholder].concat(
			this.props.groups
				.keySeq()
				.filterNot(group => currentGroups.includes(group))
				.sort()
				.map(group => (
					<option key={group} value={group}>
						{group}
					</option>
				))
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
								<label htmlFor="groups">
									Insert the groups from low to high priority
								</label>
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
									className={classNames('btn', {
										'btn-light':   !this.props.isStoringGroups && !this.props.touched,
										'btn-warning': this.props.storingGroups || this.props.touched,
									})}
									onClick={this.onSubmit}
									busy={this.props.isStoringGroups}
								>
									Save
								</AsyncButton>
							) : (
								<p
									className="text-danger pt-2"
									title={`Supported since ${supportedSince}, currently running ${current}`}
								>
									<span className="fas fa-exclamation-circle pr-2" />
									Agent does not support updating groups (since:{' '}
									{supportedSince}, currently: {current})
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
		const selectedDevice = getSelectedDevice(state)

		return {
			selectedDevice,
			groups:          state.get('groups'),
			isStoringGroups: getAsyncState([
				'isStoringGroups',
				selectedDevice.get('deviceId'),
			])(state),
		}
	},
	{ asyncStoreGroups }
)(GroupsForm)
