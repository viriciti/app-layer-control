import React, { PureComponent } from 'react'
import { reduxForm, Field } from 'redux-form/immutable'

import TextInputGroup from '/routes/administration/commons/TextInputGroup'
import validate from '/routes/administration/modules/validateImageForm'

class RegistryImageForm extends PureComponent {
	onSubmit = values => {
		this.props.reset()
		this.props.onSubmit(values)
	}

	render () {
		return (
			<form className="mb-3" onSubmit={this.props.handleSubmit(this.onSubmit)}>
				<Field
					component={TextInputGroup}
					name="name"
					placeholder="Name of the image"
					submit={{
						text:     'Add image',
						textBusy: 'Adding image',
						icon:     'fas fa-archive',
						reduxKey: 'isAddingRegistryImage',
					}}
					type="text"
				/>
			</form>
		)
	}
}

export default reduxForm({
	form: 'registryImage',
	validate,
})(RegistryImageForm)
