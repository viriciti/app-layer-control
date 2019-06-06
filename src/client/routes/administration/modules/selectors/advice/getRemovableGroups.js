import { createSelector } from 'reselect'
import countDevicesPerGroup from '/routes/administration/modules/selectors/countDevicesPerGroup'

const getRemovableGroups = devicesPerGroup => {
	return devicesPerGroup
		.filter(amount => amount === 0)
		.keySeq()
		.toList()
}

export default createSelector(
	[countDevicesPerGroup],
	getRemovableGroups
)
