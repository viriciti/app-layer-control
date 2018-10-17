import React, { PureComponent } from 'react'

import ConfigurationsListItem from './ConfigurationsListItem'

class ConfigurationsList extends PureComponent {
	renderConfigurationsList = () => {
		const { configurations, onConfigurationSelected, selectedConfiguration } = this.props

		return configurations.valueSeq().map(configuration => {
			return (
				<ConfigurationsListItem
					key={configuration.get('applicationName')}
					configuration={configuration}
					onConfigurationSelected={onConfigurationSelected}
					selected={
						selectedConfiguration &&
						selectedConfiguration.get('applicationName') === configuration.get('applicationName')
					}
				/>
			)
		})
	}

	render () {
		return this.props.configurations.toArray().length ? (
			<ul className="list-group col-3">{this.renderConfigurationsList()}</ul>
		) : null
	}
}

export default ConfigurationsList
