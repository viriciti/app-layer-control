import React, { PureComponent } from 'react'
import naturalCompare from 'natural-compare-lite'

import ConfigurationsListItem from './ConfigurationsListItem'

class ConfigurationsList extends PureComponent {
	renderConfigurationsList = () => {
		const { configurations, onConfigurationSelected, selectedConfiguration } = this.props

		return configurations
			.valueSeq()
			.sort((previous, next) => {
				return naturalCompare(previous.get('applicationName'), next.get('applicationName'))
			})
			.map(configuration => {
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
