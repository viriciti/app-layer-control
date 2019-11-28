import JSONPretty from 'react-json-pretty'
import React, { PureComponent } from 'react'
import { List } from 'immutable'
import { change } from 'redux-form'
import { connect } from 'react-redux'

import AsyncButton from '/components/common/AsyncButton'
import { asyncRemoveApplication } from '/routes/administration/modules/actions/index'
import getConfigurationDependents from '/routes/administration/modules/selectors/getConfigurationDependents'
import getAsyncState from '/store/selectors/getAsyncState'

class ConfigurationInfo extends PureComponent {
	state = {
		deleting: false,
	}

	getDependents () {
		return this.props.dependents.get(
			this.props.selectedConfiguration.get('applicationName'),
			List()
		)
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
									onClick={this.props.onCopyApplication}
									className="btn btn-light"
									type="button"
									disabled={this.props.isRemovingApplication}
								>
									<span className="fas fa-clone" /> Copy
								</button>

								<button
									onClick={this.props.onEditApplication}
									className="btn btn-light"
									type="button"
									disabled={this.props.isRemovingApplication}
								>
									<span className="fas fa-edit" /> Edit
								</button>

								<AsyncButton
									busy={this.props.isRemovingApplication}
									className="btn btn-danger btn--icon"
									onClick={this.onDelete}
									type="button"
									title="Delete application"
									white
								>
									<span className="fas fa-trash" />
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
		asyncRemoveApplication,
		change,
	}
)(ConfigurationInfo)
