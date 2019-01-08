import React, { Fragment } from 'react'
import JSONPretty from 'react-json-pretty'
import { connect } from 'react-redux'

import { removeImage } from '/routes/devices/modules/actions/index'

const ImageOverview = ({ selectedImage, selectedDevice, removeImage }) => {
	const onRemoveImage = () => {
		if (confirm('The image will be removed. Are you sure?')) {
			removeImage({
				dest:    selectedDevice,
				payload: { id: selectedImage.get('name') },
			})
		}
	}

	return (
		<Fragment>
			<h5>
				<b>{selectedImage.get('name')}</b>
			</h5>

			<JSONPretty id="json-pretty" json={selectedImage.toJS()} />

			<button className="btn btn-danger btn--icon float-right my-3" type="button" onClick={onRemoveImage}>
				<span className="fas fa-trash" />
			</button>
		</Fragment>
	)
}

export default connect(
	state => {
		return {
			devices: state.get('devices'),
		}
	},
	{ removeImage }
)(ImageOverview)
