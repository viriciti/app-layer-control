import { EventEmitter } from 'events'

export default class WebSocket extends EventEmitter {
	#timeout
	#listeners = []

	constructor(url, protocols = []) {
		super()

		this.url = url
		this.protocols = protocols
		this.#connect()
	}

	addEventListener(type, listener) {
		this.#listeners.push({ type, listener })
		this.socket.addEventListener(type, listener)
	}

	removeEventListener(type, listener) {
		this.socket.removeEventListener(type, listener)

		const index = this.#listeners.findIndex(({ listener: fn }) => fn === listener)
		if (index !== -1) {
			this.#listeners.splice(index, 1)
		}

	}

	send(data) {
		this.socket.send(data)
	}

	#connect() {
		this.socket = new window.WebSocket(this.url, this.protocols)

		this.socket.addEventListener('close', this.#onClose)
		this.socket.addEventListener('error', this.#onError)
		this.socket.addEventListener('message', this.#onMessage)
		this.socket.addEventListener('open', this.#onOpen)

		this.#listeners.forEach(({ type, listener }) => this.socket.addEventListener(type, listener))
		this.#timeout = undefined
	}

	#reconnect() {
		this.socket.removeEventListener('close', this.#onClose)
		this.socket.removeEventListener('error', this.#onError)
		this.socket.removeEventListener('message', this.#onMessage)
		this.socket.removeEventListener('open', this.#onOpen)

		console.warn('Connection closed, reconnecting ...')
		this.#connect()
	}

	#onOpen = event => {
		this.emit('open', event)
	}

	#onError = event => {
		this.emit('error', event)
	}

	#onMessage = event => {
		this.emit('message', event)
	}

	#onClose = () => {
		if (this.#timeout) {
			clearTimeout(this.#timeout)
		}

		this.#timeout = setTimeout(() => this.#reconnect(), 3000)
	}
}
