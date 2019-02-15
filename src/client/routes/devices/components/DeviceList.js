import React, { PureComponent } from 'react'
import naturalCompareLite from 'natural-compare-lite'
import { Map, List } from 'immutable'
import { connect } from 'react-redux'
import { isEqual, partial } from 'lodash'

import DeviceDetail from './DeviceDetail'
import DeviceListItem from './DeviceListItem'
import Filters from './Filters'
import PaginationControl from './pagination/PaginationControl'
import PaginationTableBody from './pagination/PaginationTableBody'
import TableHead from './table/TableHead'

import selectedDeviceSelector from '/routes/devices/modules/selectors/getSelectedDevice'
import selectorDevicesSerial from '/routes/devices/modules/selectors/getDevicesSerial'
import filterSelector from '/routes/devices/modules/selectors/getActiveFilters'
import {
	selectDevice,
	storeGroups,
	removeGroup,
	multiSelectDevices,
	multiSelectAction,
	clearMultiSelect,
	asyncMultiStoreGroup,
	asyncMultiRemoveGroup,
	paginateTo,
	resetPagination,
	fetchDevices,
	fetchSources,
} from '/routes/devices/modules/actions'
import { fetchGroups, fetchApplications } from '/routes/administration/modules/actions'
import toReactKey from '/utils/toReactKey'
import getAsyncState from '/store/selectors/getAsyncState'

class DeviceList extends PureComponent {
	defaultFilters = {
		device:        '',
		groups:        '',
		groupsExclude: false,
		version:       '',
		error:         '',
		isSubmitting:  false,
	}

	constructor () {
		super()

		this.state = {
			selectedVersion: '',
			sortBy:          { field: 'deviceId', asc: true },
		}
	}

	componentDidMount () {
		this.props.fetchDevices()
		this.props.fetchSources()
		this.props.fetchGroups()
		this.props.fetchApplications()
	}

	onSort = field => {
		if (isEqual(this.state.sortBy.field, field)) {
			return this.setState(prevState => {
				return { sortBy: { field, asc: !prevState.sortBy.asc } }
			})
		}

		this.setState({ sortBy: { field, asc: true } })
	}

	onStoreGroup = async label => {
		const devices = this.props.multiSelectedDevices
			.filterNot(deviceId => this.props.devices.getIn([deviceId, 'groups'], List()).includes(label))
			.toArray()

		if (confirm(`Add group '${label}' to ${devices.length} device(s)?`)) {
			this.props.asyncMultiStoreGroup(devices, label)
			this.props.clearMultiSelect()
		}
	}

	onRemoveGroup = async label => {
		const devices = this.props.multiSelectedDevices
			.filter(deviceId => this.props.devices.getIn([deviceId, 'groups'], List()).includes(label))
			.toArray()

		if (confirm(`Remove group '${label}' from ${devices.length} device(s)?`)) {
			this.props.asyncMultiRemoveGroup(devices, label)
			this.props.clearMultiSelect()
		}
	}

	sortDevices () {
		const field   = this.state.sortBy.field.split('.')
		const devices = this.props.filteredItems
			.filter(device => device.get('deviceId'))
			.sortBy(device => device.getIn(field, ''))
			.sort(device => -device.has('connected'))

		if (!this.state.sortBy.asc) {
			return devices.reverse()
		} else {
			return devices
		}
	}

	multiSelectOptions () {
		return this.props.groups
			.keySeq()
			.filterNot(group => group === 'default')
			.toArray()
			.sort(naturalCompareLite)
	}

	renderDevicesTable = () => {
		if (this.props.isFetchingDevices) {
			return <div className="loader" />
		} else {
			return (
				<div className="table-responsive">
					<table className="table table-hover">
						<thead>
							<tr>
								<th className="align-middle">
									<div className="custom-control custom-checkbox">
										<input
											className="custom-control-input"
											id="selectAll"
											title="Select all devices"
											type="checkbox"
											onChange={() => {
												this.props.multiSelectDevices(
													this.props.filteredItems
														.valueSeq()
														.map(device => device.get('deviceId'))
														.toList()
												)
											}}
											checked={this.props.multiSelectedDevices.size === this.props.filteredItems.size}
										/>

										<label className="custom-control-label" htmlFor="selectAll" />
									</div>
								</th>

								{this.props.deviceSources
									.filter(deviceSource => {
										return deviceSource.get('entryInTable')
									})
									.map((column, key) => {
										return (
											<TableHead
												key={`header-${key}`}
												onClick={partial(this.onSort, key)}
												sortable={column.get('sortable')}
												ascending={this.state.sortBy.asc}
												sorted={this.state.sortBy.field === key}
												headerName={column.get('headerName')}
												headerStyle={column.get('headerStyle', Map()).toJS()}
											/>
										)
									})
									.valueSeq()}
							</tr>
						</thead>
						<tbody>
							{this.sortDevices().size ? (
								<PaginationTableBody
									renderData={this.sortDevices().valueSeq()}
									component={info => {
										return (
											<DeviceListItem
												key={info.get('deviceId')}
												info={info}
												onSelectionToggle={this.onSelectionToggle}
												selected={this.props.multiSelectedDevices.includes(info.get('deviceId'))}
												configurations={this.props.configurations}
												deviceSources={this.props.deviceSources}
											/>
										)
									}}
								/>
							) : (
								<tr className="tr--no-hover">
									<td colSpan="10000">
										<h4 className="text-center text-secondary my-5">No results matching this criteria</h4>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)
		}
	}

	render () {
		const { selectedDevice } = this.props

		return (
			<div className="mx-3 mb-4">
				<header className="dashboard-header">
					<span className="dashboard-header__icon fas fa-hdd" />
					<div className="dashboard-header__titles-container">
						<h1 className="dashboard-header__title">Devices</h1>
						<h2 className="dashboard-header__subtitle">Configure your devices</h2>
					</div>
				</header>

				<div className="row ">
					<div className="col-lg-12 mb-3">
						<Filters />
					</div>
				</div>

				<div className="row">
					<div className="col">
						<div className="card">
							<div className="card-controls mb-3">
								<div className="btn-group">
									<button
										className="btn btn-light btn-sm dropdown-toggle mr-2"
										data-toggle="dropdown"
										disabled={
											this.props.multiSelectedDevices.size === 0 ||
											this.props.isStoringMultiGroups ||
											this.props.isRemovingMultiGroups
										}
										type="button"
									>
										<span className="fas fa-plus-circle" /> Add Group ({this.props.multiSelectedDevices.size})
									</button>

									<div className="dropdown-menu">
										{this.multiSelectOptions().map(name => (
											<button
												key={toReactKey('addGroup', name)}
												className="dropdown-item cursor-pointer"
												onClick={partial(this.onStoreGroup, name)}
											>
												<small>{name}</small>
											</button>
										))}
									</div>
								</div>

								<div className="btn-group">
									<button
										className="btn btn-danger btn-sm dropdown-toggle mr-2"
										data-toggle="dropdown"
										disabled={
											this.props.multiSelectedDevices.size === 0 ||
											this.props.isStoringMultiGroups ||
											this.props.isRemovingMultiGroups
										}
										type="button"
									>
										<span className="fas fa-minus-circle" /> Remove Group ({this.props.multiSelectedDevices.size})
									</button>

									<div className="dropdown-menu">
										{this.multiSelectOptions().map(name => (
											<button
												key={toReactKey('removeGroup', name)}
												className="dropdown-item cursor-pointer"
												onClick={partial(this.onRemoveGroup, name)}
											>
												<small>{name}</small>
											</button>
										))}
									</div>
								</div>
							</div>

							<div className="card-body">
								<div className="row">
									<div className="col">
										{this.renderDevicesTable()}

										<DeviceDetail
											open={!!selectedDevice}
											selectedDevice={selectedDevice}
											onModalClose={this.onModalClose}
											deviceSources={this.props.deviceSources}
										/>
									</div>
								</div>
							</div>

							<div className="card-controls">
								<PaginationControl pageRange={2} data={this.sortDevices()} />
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			devices:               state.get('devices'),
			groups:                state.get('groups'),
			multiSelectedDevices:  state.getIn(['multiSelect', 'selected']),
			multiSelectedAction:   state.getIn(['multiSelect', 'action']),
			deviceSources:         state.get('deviceSources'),
			configurations:        state.get('configurations'),
			isStoringMultiGroups:  getAsyncState('isStoringMultiGroups')(state),
			isRemovingMultiGroups: getAsyncState('isRemovingMultiGroups')(state),
			isFetchingDevices:     getAsyncState('isFetchingDevices')(state),

			selectedDevice: selectedDeviceSelector(state),
			filteredItems:  filterSelector(state),
			serials:        selectorDevicesSerial(state),
		}
	},
	{
		selectDevice,
		storeGroups,
		removeGroup,
		multiSelectDevices,
		multiSelectAction,
		clearMultiSelect,
		asyncMultiStoreGroup,
		asyncMultiRemoveGroup,
		paginateTo,
		resetPagination,
		fetchDevices,
		fetchSources,
		fetchGroups,
		fetchApplications,
	}
)(DeviceList)
