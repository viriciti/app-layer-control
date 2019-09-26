import React, { PureComponent, Fragment } from 'react'
import naturalCompareLite from 'natural-compare-lite'
import { List } from 'immutable'
import { connect } from 'react-redux'
import { partial } from 'lodash'

import DeviceDetail from './DeviceDetail'
import DeviceListItem from './DeviceListItem'
import Filter from './Filter'
import PaginationControl from './pagination/PaginationControl'
import PaginationTableBody from './pagination/PaginationTableBody'
import TableHead from './table/TableHead'

import getSelectedDevice from '/routes/devices/selectors/getSelectedDevice'
import getDevices from '/routes/devices/selectors/getDevices'
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
} from '/routes/devices/actions'
import { applySort } from '/store/globalReducers/ui'
import toReactKey from '/utils/toReactKey'
import getAsyncState from '/store/selectors/getAsyncState'
import Import from '/routes/devices/components/Import'

class DeviceList extends PureComponent {
	state = {
		showImportModal: false,
		sortBy:          {
			field: 'deviceId',
			asc:   true,
		},
	}

	onImport = (visible = true) => {
		// TODO: Find a better way to handle visibility state
		this.setState({ showImportModal: visible })
	}

	onSort = field => {
		if (this.props.sort.get('field') === field) {
			this.props.applySort({
				field,
				ascending: !this.props.sort.get('ascending'),
			})
		} else {
			this.props.applySort({ field, ascending: true })
		}
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
					<table className="table table-hover table--fixed">
						<thead>
							<tr>
								<th className="align-middle" style={{ width: 25 }}>
									<div className="custom-control custom-checkbox">
										<input
											className="custom-control-input"
											id="selectAll"
											title="Select all devices"
											type="checkbox"
											onChange={() =>
												this.props.multiSelectDevices(this.props.devices.keySeq().toList())
											}
											checked={
												!this.props.devices.size
													? false
													: this.props.multiSelectedDevices.size === this.props.devices.size
											}
											disabled={!this.props.devices.size}
										/>

										<label className="custom-control-label" htmlFor="selectAll" />
									</div>
								</th>

								{this.props.deviceSources
									.filter(deviceSource => deviceSource.get('entryInTable'))
									.map(column => (
										<TableHead
											key={toReactKey(column.get('getIn'))}
											onSort={partial(this.onSort, column.get('getIn'))}
											sortable={column.get('sortable')}
											ascending={this.props.sort.get('ascending')}
											sorted={this.props.sort.get('field') === column.get('getIn')}
											headerName={column.get('headerName')}
											columnWidth={column.get('columnWidth')}
										/>
									))
									.valueSeq()}
							</tr>
						</thead>
						<tbody>
							<PaginationTableBody
								renderData={this.props.devices.valueSeq()}
								component={info => (
									<DeviceListItem
										key={info.get('deviceId')}
										info={info}
										onSelectionToggle={this.onSelectionToggle}
										selected={this.props.multiSelectedDevices.includes(info.get('deviceId'))}
										configurations={this.props.configurations}
										deviceSources={this.props.deviceSources}
									/>
								)}
							/>
						</tbody>
					</table>

					{this.props.filter.size && !this.props.devices.size ? (
						<h6 className="text-center text-secondary my-5">
							No devices were found with these search queries
						</h6>
					) : !this.props.devices.size ? (
						<h6 className="text-center text-secondary my-5">No devices were found</h6>
					) : null}
				</div>
			)
		}
	}

	render () {
		const { selectedDevice } = this.props

		return (
			<Fragment>
				<div className="mx-3 mb-4">
					<header className="dashboard-header">
						<span className="dashboard-header__icon fas fa-hdd" />
						<div className="dashboard-header__titles-container">
							<h1 className="dashboard-header__title">Devices</h1>
							<h2 className="dashboard-header__subtitle">Configure your devices</h2>
						</div>
					</header>

					<div className="row">
						<div className="col">
							<div className="card">
								<div className="card-controls">
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
											<span className="fad fa-user-plus" /> Add Group (
											{this.props.multiSelectedDevices.size})
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
											className="btn btn-light btn-sm dropdown-toggle mr-2"
											data-toggle="dropdown"
											disabled={
												this.props.multiSelectedDevices.size === 0 ||
												this.props.isStoringMultiGroups ||
												this.props.isRemovingMultiGroups
											}
											type="button"
										>
											<span className="fad fa-user-minus fa-fw" /> Remove Group (
											{this.props.multiSelectedDevices.size})
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

									<div className="float-right">
										<button className="btn btn-light btn-sm" onClick={partial(this.onImport, true)}>
											<span className="fad fa-file-import mr-1" /> Import
										</button>
									</div>
								</div>

								<Filter />

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
									<PaginationControl pageRange={2} data={this.props.devices} />
								</div>
							</div>
						</div>
					</div>
				</div>

				<Import open={this.state.showImportModal} onClose={partial(this.onImport, false)} />
			</Fragment>
		)
	}
}

export default connect(
	state => ({
		groups:                state.get('groups'),
		multiSelectedDevices:  state.getIn(['multiSelect', 'selected']),
		multiSelectedAction:   state.getIn(['multiSelect', 'action']),
		deviceSources:         state.get('deviceSources'),
		configurations:        state.get('configurations'),
		filter:                state.getIn(['ui', 'filter'], []),
		sort:                  state.getIn(['ui', 'sort']),
		isStoringMultiGroups:  getAsyncState('isStoringMultiGroups')(state),
		isRemovingMultiGroups: getAsyncState('isRemovingMultiGroups')(state),
		isFetchingDevices:     getAsyncState('isFetchingDevices')(state),

		selectedDevice: getSelectedDevice(state),
		devices:        getDevices(state),
	}),
	{
		applySort,
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
	}
)(DeviceList)
