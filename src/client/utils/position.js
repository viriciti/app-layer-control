import { List } from 'immutable'

function length (array) {
	if (List.isList(array)) {
		return array.size
	} else {
		return array.length
	}
}

export function isFirstElement (_, index) {
	return index === 0
}

export function isLastElement (array, index) {
	return length(array) - 1 === index
}
