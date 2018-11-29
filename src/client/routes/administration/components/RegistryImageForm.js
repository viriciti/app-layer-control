import React, { PureComponent } from 'react'
import { reduxForm, Field } from 'redux-form/immutable'

import TextInputGroup from 'routes/administration/commons/TextInputGroup'
import validate from 'routes/administration/modules/validateImageForm'

class RegistryImageForm extends PureComponent {
	render () {
		return (
			<form className="mb-3" onSubmit={this.props.handleSubmit(this.props.onSubmit)}>
				<Field
					component={TextInputGroup}
					name="name"
					placeholder="Name of the image"
					submit={{
						text: 'Add Image',
						icon: 'fas fa-archive',
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
