import JSONPretty from 'react-json-pretty'
import React, { PureComponent } from 'react'
import { List } from 'immutable'
import { change } from 'redux-form'
import { connect } from 'react-redux'

import AsyncButton from '/components/common/AsyncButton'
import { removeConfiguration } from '/routes/administration/modules/actions/index'
import getConfigurationDependents from '/routes/administration/modules/selectors/getConfigurationDependents'
import getAsyncState from '/store/selectors/getAsyncState'

class ConfigurationInfo extends PureComponent {
	state = {
		deleting: false,
	}

	getDependents () {
		return this.props.dependents.get(this.props.selectedConfiguration.get('applicationName'), List())
	}

	onEdit = () => {
		this.props.onEditApplication()
	}

	onDelete = async () => {
		if (confirm('Are you sure you want to remove this application?')) {
			this.props.asyncRemoveApplication(this.props.selectedConfiguration.get('applicationName'))
		}
	}

	render () {
		if (!this.props.selectedConfiguration) {
			return (
				<div className="col-9">
					<span className="card-message">No application selected</span>
				</div>
			)
		} else {
			const dependents = this.getDependents()

			return (
				<div className="col-9">
					<div className="row mb-1">
						<div className="col-12 text-right">
							{dependents.size ? (
								<small>
									<b>Dependents:</b> {dependents.join(', ')}
								</small>
							) : (
								<small className="text-secondary">No dependents</small>
							)}
						</div>
					</div>

					<JSONPretty id="json-pretty" className="p-2" json={this.props.selectedConfiguration} />

					<div className="row">
						<div className="col-12">
							<div className="btn-group float-right">
								<button
									onClick={this.onEdit}
									className="btn btn-primary"
									type="button"
									disabled={this.props.isRemovingApplication}
								>
									<span className="fas fa-paste" /> Edit
								</button>

								<AsyncButton
									busy={this.props.isRemovingApplication}
									busyText="Deleting ..."
									className="btn btn-secondary"
									onClick={this.onDelete}
									type="button"
									white
								>
									<span className="fas fa-trash" /> Delete
								</AsyncButton>
							</div>
						</div>
					</div>
				</div>
			)
		}
	}
}

export default connect(
	state => {
		return {
			dependents:            getConfigurationDependents(state),
			isRemovingApplication: getAsyncState(['isRemovingApplication'])(state),
		}
	},
	{
		removeConfiguration,
		change,
	}
)(ConfigurationInfo)
