import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import { Provider } from 'react-redux'

import CoreLayout from './CoreLayout'
import getRoutes from '/routes'

import '/styles/app.scss'
import 'react-json-pretty/JSONPretty.monikai.styl'

const App = ({ store }) => {
	return (
		<Provider store={store}>
			<BrowserRouter>
				<CoreLayout
					children={getRoutes(store).map((route, index) => {
						return <Route {...route} key={index} />
					})}
				/>
			</BrowserRouter>
		</Provider>
	)
}

export default App
