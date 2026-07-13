/**
 * The Add Interaction toolbar button at the top of the editor.
 */
import AddInteractionButton from './add-interaction-button'

import { subscribe } from '@wordpress/data'
import { createRoot } from '@wordpress/element'
import { domReady } from '~interact/shared/dom-ready.js'

const mountAddButton = () => {
	// Render our button.
	const buttonDiv = document.createElement( 'div' )
	buttonDiv.classList.add( 'interact-add-interaction-button-wrapper' )
	createRoot( buttonDiv ).render( <AddInteractionButton /> )

	// Just keep on checking because there are times when the toolbar gets
	// unmounted.
	subscribe( () => {
		setTimeout( () => {
			const toolbar = document.querySelector( '.edit-post-header-toolbar' )
			if ( toolbar ) {
				// If the button gets lost, just attach it again.
				if ( ! toolbar.querySelector( '.interact-add-interaction-button-wrapper' ) ) {
					// If .interact-insert-library-button__wrapper button is present, add after this button.
					const insertLibraryButton = toolbar.querySelector( '.interact-insert-library-button__wrapper' )
					if ( insertLibraryButton ) {
						insertLibraryButton.after( buttonDiv )
					} else {
						toolbar.appendChild( buttonDiv )
					}
				}
			}
		}, 100 )
	} )
}

domReady( mountAddButton )
