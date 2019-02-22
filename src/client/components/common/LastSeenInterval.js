import { PureComponent } from 'react'
import { uniqueId, forEach } from 'lodash'

const listeners = {}
setInterval(() => {
	forEach(listeners, fn => fn())
}, 30 * 1000)

export default class LastSeenInterval extends PureComponent {
	componentDidMount () {
		this.id            = uniqueId('reactLastSeenInterval')
		listeners[this.id] = this.updateComponent
	}

	componentWillUnmount () {
		delete listeners[this.id]
	}

	updateComponent = () => {
		this.forceUpdate()
	}

	render () {
		return this.props.updateComponent()
	}
}
