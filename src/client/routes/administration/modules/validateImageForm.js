export default (values, props) => {
	const errors = {}

	if (!values.name || !values.name.trim()) {
		errors.name = 'Enter an image name'
	} else if (props.imageNames.includes(values.name)) {
		errors.name = 'This image is already added'
	}

	return errors
}
