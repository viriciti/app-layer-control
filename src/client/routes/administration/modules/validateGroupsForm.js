import { size } from 'underscore'

export default (values, props) => {
	const errors = {}

	if (!values.label || !values.label.trim()) {
		errors.label = 'Enter a label'
	} else if (props.isAdding && !props.isEditing && props.groupsLabels.includes(values.label.trim())) {
		errors.label = 'This name is already used. Please edit the existing group instead.'
	}

	if (values.label === 'default' && !size(values.applications)) {
		errors.applications = 'The default group must have at least one application.'
	}

	return errors
}
