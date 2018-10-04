import React from 'react'
import classNames from 'classnames'

const ConfigurationsListItem = props => {
	const { onConfigurationSelected, configuration, selected } = props
	const onSelectConfiguration = () => {
		return onConfigurationSelected(configuration)
	}

	return (
		<li className="mb-2" onClick={onSelectConfiguration}>
			<button className={classNames('btn', 'btn--select', 'btn-block', { active: selected })}>
				{configuration.get('applicationName')}
			</button>
		</li>
	)
}

export default ConfigurationsListItem
