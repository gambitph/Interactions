/**
 * The Add Interaction toolbar button at the top of the editor.
 */
import AddInteractionButton from './add-interaction-button'

import { createRoot } from '@wordpress/element'
import { domReady } from '~interact/shared/dom-ready.js'

const mountAddButton = () => {
	// Render our button.
	const buttonDiv = document.createElement( 'div' )
	buttonDiv.classList.add( 'interact-add-interaction-button-wrapper' )
	createRoot( buttonDiv ).render( <AddInteractionButton /> )

	const ensureButtonMounted = () => {
		const toolbar = document.querySelector( '.edit-post-header-toolbar' )
		if ( ! toolbar || toolbar.querySelector( '.interact-add-interaction-button-wrapper' ) ) {
			return
		}

		// If .ugb-insert-library-button__wrapper is present, add after this button.
		const insertLibraryButton = toolbar.querySelector( '.ugb-insert-library-button__wrapper' )
		if ( insertLibraryButton ) {
			insertLibraryButton.after( buttonDiv )
		} else {
			toolbar.appendChild( buttonDiv )
		}
	}

	let timeoutId
	const scheduleEnsureButtonMounted = () => {
		// Debounce DOM updates to avoid excessive checks.
		clearTimeout( timeoutId )
		timeoutId = setTimeout( ensureButtonMounted, 100 )
	}

	new MutationObserver( scheduleEnsureButtonMounted ).observe( document.body, {
		childList: true,
		subtree: true,
	} )

	// Runs the mount check immediately once on startup.
	ensureButtonMounted()
}

domReady( mountAddButton )
