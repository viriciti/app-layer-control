import React, { Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'

import { asyncRemoveImage } from '/routes/devices/actions/index'
import AsyncButton from '/components/common/AsyncButton'
import getIdFromHash from '/routes/devices/modules/getIdFromHash'
import getAsyncState from '/store/selectors/getAsyncState'

const ImageOverview = ({
	selectedImage,
	selectedDevice,
	asyncRemoveImage,
	isRemovingImage,
}) => {
	if (!selectedImage) {
		return (
			<p className="py-3 text-warning">
				<span className="fas fa-exclamation-circle mr-2" />
				Image not found
			</p>
		)
	}

	const onRemoveImage = () => {
		if (confirm('The image will be removed. Are you sure?')) {
			asyncRemoveImage(selectedDevice, getIdFromHash(selectedImage.get('id')))
		}
	}

	return (
		<Fragment>
			<h5>
				<b>{selectedImage.get('name')}</b>
			</h5>

			<JSONPretty id="json-pretty" json={selectedImage.toJS()} />

			<AsyncButton
				className="btn btn-danger btn--icon float-right my-3"
				onClick={onRemoveImage}
				type="button"
				busy={isRemovingImage}
			>
				<span className="fas fa-trash" />
			</AsyncButton>
		</Fragment>
	)
}

export default connect(
	(state, ownProps) => {
		return {
			devices:         state.get('devices'),
			isRemovingImage: getAsyncState([
				'isRemovingImage',
				ownProps.selectedDevice,
				ownProps.selectedImage && getIdFromHash(ownProps.selectedImage.get('id')),
			])(state),
		}
	},
	{ asyncRemoveImage }
)(ImageOverview)
