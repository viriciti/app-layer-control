import { Iterable } from 'immutable'
import { defaultTo } from 'lodash'

function wrapValueGetter (key) {
	return source => {
		if (Iterable.isIterable(source)) {
			return source
				.get(key, '')
				.toLowerCase()
				.trim()
		} else {
			return defaultTo(source, '')
				.toLowerCase()
				.trim()
		}
	}
}

const getHeaderName = wrapValueGetter('headerName')

export default (values, props) => {
	const errors           = {}
	const isHeaderNameUsed = props.deviceSources
		.filter(
			customSource =>
				getHeaderName(customSource) !== getHeaderName(props.editing)
		)
		.some(
			customSource =>
				getHeaderName(customSource) === getHeaderName(values.headerName)
		)

	if (!values.headerName) {
		errors.headerName = 'Enter a header name'
	} else if (!values.headerName.match(/^[a-zA-Z0-9 ]+$/)) {
		errors.headerName = 'Header name can only contain a-z, A-Z, 0-9 and spaces'
	} else if (isHeaderNameUsed) {
		errors.headerName = 'This header name is already used'
	}

	if (!values.getIn) {
		errors.getIn = 'Enter a source'
	}

	// Table validation rules
	if (values.entry && values.entry.includes('table')) {
		if (!values.columnWidth) {
			errors.columnWidth = 'How wide should the column be?'
		} else if (values.columnWidth < 10) {
			errors.columnWidth = 'Column is too small'
		} else if (values.columnWidth > 250) {
			errors.columnWidth = 'Column will take too much space'
		}
	}

	return errors
}
