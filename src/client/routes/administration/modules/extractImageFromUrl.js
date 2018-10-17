export default url => {
	const parts = url.split('/')

	return parts.slice(parts.length - 2).join('/')
}
