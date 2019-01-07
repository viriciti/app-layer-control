import { createSelector } from 'reselect'
import { List } from 'immutable'

import extractImageFromUrl from '/routes/administration/modules/extractImageFromUrl'

const getRegistryImages = state => {
	return state.get('registryImages')
}

const getRegistryImagesNames = registryImages => {
	if (!registryImages) {
		return List()
	} else {
		return registryImages.keySeq().map(extractImageFromUrl)
	}
}

export default createSelector(
	getRegistryImages,
	getRegistryImagesNames
)
