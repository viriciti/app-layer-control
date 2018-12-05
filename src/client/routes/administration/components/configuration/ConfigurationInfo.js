import JSONPretty from 'react-json-pretty'
import React from 'react'
import { List } from 'immutable'
import { change } from 'redux-form'
import { connect } from 'react-redux'

import { removeConfiguration } from 'routes/administration/modules/actions/index'
import getConfigurationDependents from 'routes/administration/modules/selectors/getConfigurationDependents'

const ConfigurationInfo = ({ selectedConfiguration, removeConfiguration, onEditApplication, dependents }) => {
	if (!selectedConfiguration) {
		return (
			<div className="col-9">
				<span className="card-message">No application selected</span>
			</div>
		)
	}

	const configurationDependents = dependents.get(selectedConfiguration.get('applicationName'), List())
	const onRemoveConfiguration = () => {
		if (confirm('The configuration will be removed. Are you sure?')) {
			removeConfiguration(selectedConfiguration.get('applicationName'))
		}
	}

	return (
		<div className="col-9">
			<div className="row mb-1">
				<div className="col-12 text-right">
					{configurationDependents.size ? (
						<small>
							<b>Dependents:</b> {configurationDependents.join(', ')}
						</small>
					) : (
						<small className="text-secondary">No dependents</small>
					)}
				</div>
			</div>

			<JSONPretty id="json-pretty" className="p-2" json={selectedConfiguration} />

			<div className="row">
				<div className="col-12">
					<div className="btn-group float-right">
						<button onClick={onEditApplication} className="btn btn-primary" type="button">
							<span className="fas fa-paste" /> Edit
						</button>

						<button onClick={onRemoveConfiguration} className="btn btn-secondary" type="button">
							<span className="fas fa-trash" /> Remove
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default connect(
	state => {
		return {
			dependents: getConfigurationDependents(state),
		}
	},
	{
		removeConfiguration,
		change,
	}
)(ConfigurationInfo)
