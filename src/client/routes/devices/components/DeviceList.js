import { isEqual, find } from 'underscore'
import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { Map, List } from 'immutable'

import DeviceDetail from './DeviceDetail'
import DeviceListItem from './DeviceListItem'
import Filters from './Filters'
import PaginationControl from './pagination/PaginationControl'
import PaginationTableBody from './pagination/PaginationTableBody'
import TableHead from './table/TableHead'

import selectedDeviceSelector from '../modules/selectors/getSelectedDevice'
import selectorDevicesSerial from '../modules/selectors/getDevicesSerial'
import filterSelector from '../modules/selectors/getActiveFilters'
import {
	selectDevice,
	storeGroups,
	removeGroup,
	multiSelectDevices,
	multiSelectAction,
	clearMultiSelect,
	multiStoreGroups,
	multiRemoveGroups,
	paginateTo,
	resetPagination,
} from '../modules/actions'

class DeviceList extends PureComponent {
	defaultFilters = {
		device:        '',
		groups:        '',
		groupsExclude: false,
		version:       '',
		error:         '',
	}

	constructor () {
		super()

		this.state = {
			selectedVersion: '',
			sortBy:          { field: 'deviceId', asc: true },
		}
	}

	onMultiSelectAction = value => {
		const deviceInGroup = deviceId => {
			return this.props.devices.getIn([deviceId, 'groups'], List()).includes(value)
		}

		const action = this.props.multiSelectedAction.get('value')
		if (action === 'add') {
			const addToDevices = this.props.multiSelectedDevices.filterNot(deviceInGroup)

			if (confirm(`Add group '${value}' to ${addToDevices.size} device(s)?`)) {
				this.props.multiStoreGroups({
					dest:    addToDevices,
					payload: [value],
				})
				this.props.clearMultiSelect()
			}
		} else if (action === 'remove') {
			const removeFromDevices = this.props.multiSelectedDevices.filter(deviceInGroup)

			if (confirm(`Remove group '${value}' from ${removeFromDevices.size} device(s)?`)) {
				this.props.multiRemoveGroups({
					dest:    removeFromDevices,
					payload: value,
				})
				this.props.clearMultiSelect()
			}
		} else {
			this.props.clearMultiSelect()
		}
	}

	onSort = field => {
		if (isEqual(this.state.sortBy.field, field)) {
			return this.setState(prevState => {
				return { sortBy: { field, asc: !prevState.sortBy.asc } }
			})
		}

		this.setState({ sortBy: { field, asc: true } })
	}

	renderDevicesTable = () => {
		if (this.props.devices.isEmpty()) {
			return <div className="loader" />
		}

		return (
			<div className="table-responsive">
				<table className="table table-hover">
					<thead className="thead-light">
						<tr>
							<th className="align-middle">
								<input
									title="Select all devices"
									className="d-block mx-auto w-auto"
									type="checkbox"
									onClick={() => {
										this.props.multiSelectDevices(
											this.props.filteredItems
												.valueSeq()
												.map(device => {
													return device.get('deviceId')
												})
												.toList()
										)
									}}
									checked={this.props.multiSelectedDevices.size === this.props.filteredItems.size}
								/>
							</th>

							{this.props.deviceSources
								.filter(deviceSource => {
									return deviceSource.get('entryInTable')
								})
								.map((column, key) => {
									return (
										<TableHead
											position={key}
											key={`header-${key}`}
											onClick={() => {
												this.onSort(key)
											}}
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
						{this.getSortedDevices().size ? (
							<PaginationTableBody
								renderData={this.getSortedDevices().valueSeq()}
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

	getSortedDevices = () => {
		const field = this.state.sortBy.field.split('.')
		const devices = this.props.filteredItems
			.filter(device => {
				return device.get('deviceId')
			})
			.sortBy(device => {
				return device.getIn(field, '')
			})

		if (!this.state.sortBy.asc) {
			return devices.reverse()
		} else {
			return devices
		}
	}

	renderMultiSelection = () => {
		const groupsOptions = this.props.groups
			.keySeq()
			.filterNot(group => {
				return group === 'default'
			})
			.toArray()
			.map(name => {
				return {
					value: name,
					label: name,
				}
			})
		const options = [
			{
				value:       'add',
				label:       'Add Group',
				placeholder: 'Select a group',
				options:     groupsOptions,
			},
			{
				value:       'remove',
				label:       'Remove Group',
				placeholder: 'Select a group',
				options:     groupsOptions,
			},
		]

		return (
			<Fragment>
				<select
					className="form-control w-auto"
					disabled={this.props.multiSelectedDevices.size === 0}
					value={this.props.multiSelectedAction.get('value', '')}
					onChange={({ target: { value } }) => {
						return this.props.multiSelectAction(find(options, { value }))
					}}
					title={`${this.props.multiSelectedDevices.size} devices will be affected`}
				>
					<option value="">With selected ({this.props.multiSelectedDevices.size})</option>
					{options.map(option => {
						return (
							<option key={`${option.value}${option.label}`} value={option.value}>
								{option.label} ({this.props.multiSelectedDevices.size})
							</option>
						)
					})}
				</select>

				{this.props.multiSelectedAction.get('options', Map()).size ? (
					<select
						className="form-control w-auto my-3"
						disabled={this.props.multiSelectedDevices.size === 0}
						onChange={({ target }) => {
							return this.onMultiSelectAction(target.value)
						}}
					>
						<option>{this.props.multiSelectedAction.get('placeholder', 'Select an option')}</option>

						{this.props.multiSelectedAction.get('options').map(option => {
							return (
								<option
									key={`${this.props.multiSelectedAction.get('value')}-${option.get('value')}`}
									value={option.get('value')}
								>
									{option.get('label')}
								</option>
							)
						})}
					</select>
				) : null}
			</Fragment>
		)
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
					<div className="col-lg-10 mb-3">
						<Filters />
					</div>

					<div className="col-lg-2 mb-3">
						<div className="card">
							<div className="card-header">Legend</div>

							<div className="card-body">
								<ul>
									<li className="my-3">
										<span className="fas fa-heartbeat icon text-danger pr-2" data-toggle="tooltip" />
										Container is down
									</li>
									<li className="my-3">
										<span className="fas fa-download icon text-warning pr-2" data-toggle="tooltip" />
										Outdated software
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<div className="row">
					<div className="col">
						<div className="card">
							<div className="card-header">Devices</div>

							<div className="card-body spacing-md">
								<div className="row mb-5">
									<div className="col-md-6">{this.renderMultiSelection()}</div>
								</div>

								<div className="row">
									<div className="col">
										{this.renderDevicesTable()}

										<PaginationControl pageRange={2} data={this.getSortedDevices()} />

										<DeviceDetail
											open={!!selectedDevice}
											onModalClose={this.onModalClose}
											osVersion={this.props.osVersion}
											deviceSources={this.props.deviceSources}
										/>
									</div>
								</div>
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
			devices:              state.get('devices'),
			groups:               state.get('groups'),
			multiSelectedDevices: state.getIn(['multiSelect', 'selected']),
			multiSelectedAction:  state.getIn(['multiSelect', 'action']),
			deviceSources:        state.get('deviceSources'),
			configurations:       state.get('configurations'),

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
		multiStoreGroups,
		multiRemoveGroups,
		paginateTo,
		resetPagination,
	}
)(DeviceList)
