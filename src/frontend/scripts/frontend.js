import { domReady } from '~interact/shared/dom-ready.js'
import InteractRunner from './class-runner'

window.InteractRunner = new InteractRunner()

domReady( () => {
	setTimeout( () => window.InteractRunner.init(), 1 )
} )
