import React, { useEffect } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import { Provider } from 'react-redux'

import CoreLayout from './CoreLayout'
import getRoutes from '/routes'

import {
	fetchApplications,
	fetchGroups,
	fetchRegistry,
} from '/routes/administration/modules/actions'
import { fetchDevices, fetchSources } from '/routes/devices/actions'

import '/styles/app.scss'
import 'react-json-pretty/JSONPretty.monikai.styl'

const App = ({ store }) => {
	useEffect(() => {
		store.dispatch(fetchApplications())
		store.dispatch(fetchRegistry())
		store.dispatch(fetchDevices())
		store.dispatch(fetchSources())
		store.dispatch(fetchGroups())
	}, [])

	// <div className="loader justify-content-center align-items-center" />

	return (
		<Provider store={store}>
			<BrowserRouter>
				<CoreLayout
					children={getRoutes(store).map((route, index) => (
						<Route {...route} key={index} />
					))}
				/>
			</BrowserRouter>
		</Provider>
	)
}

export default App
