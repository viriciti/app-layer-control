import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import { Provider } from 'react-redux'

import CoreLayout from './CoreLayout'
import createStore from '../store/createStore'
import getRoutes from '../routes'

import '../styles/app.scss'
import 'react-json-pretty/JSONPretty.monikai.styl'

const store = createStore()

const App = () => {
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
