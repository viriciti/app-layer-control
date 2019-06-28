export default function getIdFromHash (hash) {
	if (hash.startsWith('sha256')) {
		return hash
			.split(':')
			.slice(1)
			.join('')
	} else {
		return hash
	}
}
