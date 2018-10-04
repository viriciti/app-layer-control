import React from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'
import { change } from 'redux-form'

import { removeConfiguration } from '../../modules/actions/index'

const ConfigurationInfo = props => {
	const { selectedConfiguration, removeConfiguration } = props

	if (!selectedConfiguration) {
		return (
			<div className="col-9">
				<span className="card-message">No configuration selected</span>
			</div>
		)
	}

	const onRemoveConfiguration = () => {
		if (confirm('The configuration will be removed. Are you sure?')) {
			removeConfiguration(selectedConfiguration.get('applicationName'))
		}
	}

	return (
		<div className="col-9">
			<JSONPretty id="json-pretty" className="p-2" json={selectedConfiguration} />

			<div className="row">
				<div className="col-12">
					<div className="btn-group float-right">
						<button onClick={props.onEditApplication} className="btn btn-primary" type="button">
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
	null,
	{
		removeConfiguration,
		change,
	}
)(ConfigurationInfo)
