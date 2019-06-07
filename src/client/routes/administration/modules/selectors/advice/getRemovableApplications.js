import { createSelector } from 'reselect'
import getConfigurationDependents from '/routes/administration/modules/selectors/getConfigurationDependents'

const getRemovableApplications = dependents => {
	return dependents
		.filter(amount => amount.size === 0)
		.keySeq()
		.toList()
}

export default createSelector(
	[getConfigurationDependents],
	getRemovableApplications
)
