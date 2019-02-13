import { PureComponent } from 'react'

const listeners = []

setInterval(() => {
	listeners.forEach(fn => {
		fn()
	})
}, 30 * 1000)

export default class LastSeenInterval extends PureComponent {
	componentDidMount () {
		this.index = listeners.push(this.updateComponent)
	}

	componentWillUnmount () {
		listeners.splice(this.index, 1)
	}

	updateComponent = () => {
		this.forceUpdate()
	}

	render () {
		return this.props.updateComponent()
	}
}
