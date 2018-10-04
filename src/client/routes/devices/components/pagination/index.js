export function calculatePages ({ data, itemsPerPage }) {
	const items = data.size
	const pages = Math.ceil(items / itemsPerPage)

	return pages
}
