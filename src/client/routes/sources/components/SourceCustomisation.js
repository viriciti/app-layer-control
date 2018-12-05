import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'

import SourceCustomisationModal from './SourceCustomisationModal'
import { editColumn, addColumn, removeColumn } from 'routes/sources/modules/actions'

const StateIcon = ({ value }) => {
	if (value) {
		return <span className="fas fa-check text-success" />
	} else {
		return <span className="fas fa-times text-danger" />
	}
}

const EditButtons = ({ visible, onEdit, onRemove }) => {
	if (!visible) {
		return <span className="fas fa-lock text-center text-muted d-block" title="This source cannot be edited" />
	} else {
		return (
			<div className="text-center">
				<button className="btn btn-light btn--icon mr-2" title="Edit this source" onClick={onEdit}>
					<span className="fas fa-pencil-alt" />
				</button>

				<button className="btn btn-danger btn--icon" title="Remove this source" onClick={onRemove}>
					<span className="fas fa-trash" />
				</button>
			</div>
		)
	}
}

class SourceCustomisation extends PureComponent {
	state = {
		isAdding:    false,
		isEditing:   false,
		editing:     null,
		showEntries: 'both',
	}

	onRequestClose = () => {
		this.setState({ isAdding: false, isEditing: false, editing: undefined })
	}

	onRemove = deviceSource => {
		if (confirm(`Are you sure you want to remove column '${deviceSource.get('headerName')}'?`)) {
			this.props.removeColumn(deviceSource.get('headerName'))
		}
	}

	onEdit = deviceSource => {
		this.setState({ isEditing: true, isAdding: false, editing: deviceSource })
	}

	onAdd = () => {
		this.setState({ isEditing: false, isAdding: true })
	}

	onSubmitAdd = values => {
		this.props.addColumn(values)
	}

	onSubmitEdit = values => {
		this.props.editColumn(this.state.editing.get('headerName'), values)
	}

	onToggleTo = type => {
		this.setState({ showEntries: type })
	}

	renderVisibility (source) {
		const defaultClassName = 'label'

		if (source.get('entryInTable') && source.get('entryInDetail')) {
			return (
				<span className={defaultClassName} title="This entry is visible in the table and the detail page">
					Table &amp; Detail
				</span>
			)
		} else if (source.get('entryInTable')) {
			return (
				<span className={classNames(defaultClassName, 'label--info')} title="This entry is only visible in the table">
					Table only
				</span>
			)
		} else if (source.get('entryInDetail')) {
			return (
				<span
					className={classNames(defaultClassName, 'label--info')}
					title="This entry is only visible in the detail page"
				>
					Detail only
				</span>
			)
		} else {
			return (
				<span className={classNames(defaultClassName, 'label--danger')} title="This entry is not visible">
					Not visible
				</span>
			)
		}
	}

	render () {
		const defaultToggleClassName = 'btn btn-sm btn--no-underline'

		return (
			<div className="card mb-3">
				<div className="card-header">
					Source customisation
					<div className="btn-group btn-group--toggle float-right">
						<button
							onClick={this.onToggleTo.bind(this, 'table')}
							className={classNames(defaultToggleClassName, {
								'btn-dark':  this.state.showEntries === 'table',
								'btn-light': this.state.showEntries !== 'table',
							})}
						>
							<span className="fas fa-table" /> <small>Table entries</small>
						</button>
						<button
							onClick={this.onToggleTo.bind(this, 'detail')}
							className={classNames(defaultToggleClassName, {
								'btn-dark':  this.state.showEntries === 'detail',
								'btn-light': this.state.showEntries !== 'detail',
							})}
						>
							<span className="fas fa-list" /> <small>Detail entries</small>
						</button>
						<button
							onClick={this.onToggleTo.bind(this, 'both')}
							className={classNames(defaultToggleClassName, {
								'btn-dark':  this.state.showEntries === 'both',
								'btn-light': this.state.showEntries !== 'both',
							})}
						>
							<span className="fas fa-list-alt" /> <small>All entries</small>
						</button>
					</div>
				</div>

				<div className="card-body">
					<div className="mt-1 mb-3 float-right">
						<button className="btn btn-primary" onClick={this.onAdd}>
							<span className="fas fa-columns" /> Add New Column
						</button>
					</div>

					<table className="table">
						<thead className="thead-light">
							<tr>
								<th>Label</th>
								<th>Position</th>
								<th>Source</th>
								<th>Placeholder</th>
								<th>Sortable</th>
								<th>Filterable</th>
								<th>Copyable</th>
								<th style={{ width: 160 }}>Visibility</th>
								<th style={{ width: 130 }} />
							</tr>
						</thead>

						<tbody>
							{this.props.deviceSources
								.valueSeq()
								.filter(deviceSource => {
									if (this.state.showEntries === 'table') {
										return deviceSource.get('entryInTable')
									} else if (this.state.showEntries === 'detail') {
										return deviceSource.get('entryInDetail')
									} else {
										return deviceSource.get('entryInTable') || deviceSource.get('entryInDetail')
									}
								})
								.map((deviceSource, index) => {
									return (
										<tr key={index} className={classNames({ inactive: !deviceSource.get('editable', true) })}>
											<td>{deviceSource.get('headerName')}</td>
											<td>{deviceSource.get('columnIndex')}</td>
											<td>{deviceSource.get('getIn')}</td>
											<td>{deviceSource.get('defaultValue')}</td>
											<td>
												<StateIcon value={deviceSource.get('sortable')} />
											</td>
											<td>
												<StateIcon value={deviceSource.get('filterable')} />
											</td>
											<td>
												<StateIcon value={deviceSource.get('copyable')} />
											</td>
											<td>{this.renderVisibility(deviceSource)}</td>
											<td>
												<EditButtons
													visible={deviceSource.get('editable', true)}
													onEdit={this.onEdit.bind(this, deviceSource)}
													onRemove={this.onRemove.bind(this, deviceSource)}
												/>
											</td>
										</tr>
									)
								})}
						</tbody>
					</table>
				</div>

				<SourceCustomisationModal
					deviceSources={this.props.deviceSources}
					editing={this.state.editing}
					isOpen={this.state.isEditing || this.state.isAdding}
					isEditing={this.state.isEditing}
					isAdding={this.state.isAdding}
					onRequestClose={this.onRequestClose}
					onSubmitAdd={this.onSubmitAdd}
					onSubmitEdit={this.onSubmitEdit}
				/>
			</div>
		)
	}
}

export default connect(
	state => {
		return {
			deviceSources: state.get('deviceSources'),
		}
	},
	{ editColumn, addColumn, removeColumn }
)(SourceCustomisation)
