import React, { Fragment } from 'react'
import ReduxToastr from 'react-redux-toastr'

import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'

import 'styles/vendor/react-redux-toastr.min.css'

const CoreLayout = ({ children }) => {
	return (
		<Fragment>
			<Header />

			<Sidebar />

			<div className="container-fluid main">
				<div className="row">
					<div className="col-12">
						{children}
						<ReduxToastr
							timeOut={5000}
							newestOnTop
							preventDuplicates={false}
							position="top-right"
							transitionIn="bounceIn"
							transitionOut="bounceOut"
							progressBar={false}
						/>
					</div>
				</div>

				<Footer />
			</div>
		</Fragment>
	)
}

export default CoreLayout
