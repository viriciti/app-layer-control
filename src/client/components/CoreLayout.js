import React, { Fragment } from 'react'
import { ToastContainer } from 'react-toastify'

import Header from '/components/Header'
import Sidebar from '/components/Sidebar'
import Footer from '/components/Footer'

const CoreLayout = ({ children }) => {
	return (
		<Fragment>
			<Header />

			<Sidebar />

			<div className="container-fluid main">
				<div className="row">
					<div className="col-12">
						{children}

						<ToastContainer
							timeout={5000}
							newestOnTop
							preventDuplicates={false}
							position="bottom-right"
							transitionIn="bounceIn"
							transitionOut="bounceOut"
						/>
					</div>
				</div>

				<Footer />
			</div>
		</Fragment>
	)
}

export default CoreLayout
