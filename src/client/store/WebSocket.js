import { EventEmitter } from 'events'

export default class WebSocket extends EventEmitter {
	#timeout

	constructor(url, protocols = []) {
		super()

		this.url = url
		this.protocols = protocols
		this.#connect()
	}

	addEventListener(type, listener) {
		this.socket.addEventListener(type, listener)
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

		this.#timeout = undefined
	}

	#reconnect() {
		this.socket.removeEventListener('close', this.#onClose)
		this.socket.removeEventListener('error', this.#onError)
		this.socket.removeEventListener('message', this.#onMessage)
		this.socket.removeEventListener('open', this.#onOpen)

		console.warn('Reconnecting ...')
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
