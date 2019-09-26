import React from 'react'
import { useSelector } from 'react-redux'
import Modal from '/components/common/Modal'
import { reduxForm, Field } from 'redux-form/immutable'
import AsyncButton from '/components/common/AsyncButton'
import FileInput from '/components/input/FileInput'
import getAsyncState from '/store/selectors/getAsyncState'

function Import ({ open, onClose, handleSubmit }) {
	const submitting = useSelector(store => console.log(store))
	const onSubmit   = values => console.log('Submitted:', values)

	return (
		<Modal onClose={onClose} title="Import" visible={open}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<Field name="file" label="Source" component={FileInput} type="text" />

				<div className="form-group btn-group float-right">
					<AsyncButton className="btn btn-primary" busy white>
						<span className="fad fa-upload mr-1" /> Upload
					</AsyncButton>

					<button className="btn btn-secondary" onClick={onClose}>
						Abort
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default reduxForm({
	enableReinitialize:      true,
	form:                    'importGroups',
	keepDirtyOnReinitialize: true,
})(Import)
