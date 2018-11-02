export default (values, props) => {
	const errors = {}

	if (!values.label || !values.label.trim()) {
		errors.label = 'Enter a label'
	} else if (props.isAdding && !props.isEditing && props.groupsLabels.includes(values.label.trim())) {
		errors.label = 'This name is already used. Please edit the existing group instead.'
	}

	return errors
}
