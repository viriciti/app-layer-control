import React from 'react'
import classNames from 'classnames'
import { partial } from 'lodash'

const ConfigurationsListItem = props => {
	const { onConfigurationSelected, configuration, selected } = props

	return (
		<li className="mb-2" onClick={partial(onConfigurationSelected, configuration)}>
			<button className={classNames('btn', 'btn--select', 'btn-block', { active: selected })}>
				{configuration.get('applicationName')}
			</button>
		</li>
	)
}

export default ConfigurationsListItem
