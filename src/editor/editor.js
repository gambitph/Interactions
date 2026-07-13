import './plugins'
import { getInteractionsEditor } from './editors'
import { domReady } from '~interact/shared/dom-ready.js'

domReady( () => {
	getInteractionsEditor().init()
} )
