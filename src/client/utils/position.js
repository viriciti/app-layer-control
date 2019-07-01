import { List } from 'immutable'

function length (array) {
	if (List.isList(array)) {
		return array.size
	} else {
		return array.length
	}
}

export function isLastElement (array, index) {
	return length(array) - 1 === index
}

export function moveElement (array, from, to) {
    const item = array.get(from)
    const list = array.delete(from).insert(to, item)

    return list
}
