import React from 'react'

const Footer = () => {
	return (
		<footer>
			<div className="row">
				<div className="mt-1 mb-3 mx-3 col-3 ml-auto">
					<small className="text-muted text-right float-right">v{process.env.VERSION}</small>
				</div>
			</div>
		</footer>
	)
}

export default Footer
