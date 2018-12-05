import { Iterable } from 'immutable'
import { every, isEmpty } from 'underscore'

function getHeaderName (source) {
	if (Iterable.isIterable(source)) {
		return source
			.get('headerName')
			.toLowerCase()
			.trim()
	} else {
		return source && source.toLowerCase().trim()
	}
}

export default (values, props) => {
	const errors = {}
	const isHeaderNameUsed = props.deviceSources
		.filter(customTableField => {
			return getHeaderName(customTableField) !== getHeaderName(props.editing)
		})
		.some(customTableField => {
			return getHeaderName(customTableField) === getHeaderName(values.headerName)
		})

	if (values.entry && (!values.entry.length || every(values.entry, isEmpty))) {
		errors.entry = 'You must specify whether the source should be visible in the table, detail page or both'
	}

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

	return errors
}
