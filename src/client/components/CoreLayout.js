import React, { Fragment } from 'react'
import ReduxToastr from 'react-redux-toastr'

import Header from './header'
import Sidebar from './sidebar'

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
			</div>
		</Fragment>
	)
}

export default CoreLayout
