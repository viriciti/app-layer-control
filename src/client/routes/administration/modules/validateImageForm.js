function isRepository (name) {
	return /^[a-zA-Z0-9-_]+(?:\/[a-zA-Z0-9-_]+)+$/.test(name)
}

export default (values, props) => {
	const errors = {}

	if (!values.name || !values.name.trim()) {
		errors.name = 'Enter a repository name'
	} else if (props.imageNames.includes(values.name)) {
		errors.name = 'This repository is already added'
	} else if (!isRepository(values.name)) {
		errors.name = 'This is not a repository name'
	}

	return errors
}
