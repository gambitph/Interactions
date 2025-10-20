/**
 * This hook adds the initial states of the actions to the editor.
 */

import { useEffect, useRef } from '@wordpress/element'
import { debounce } from 'lodash'

// Gets the main editor element, either the iframe or the main document.
const getEditorEl = () => {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' )
	let editorEl = document.querySelector( '.editor-styles-wrapper' )
	if ( iframe ) {
		editorEl = iframe.contentDocument.querySelector( '.editor-styles-wrapper' )
	}
	return editorEl
}

// Creates a style tag inside the editor to hold the initial interaction styles
export const useInitialStyleTag = style => {
	const styleTagRef = useRef( null )

	// Listen if the style tag is removed from the dom, if so, add it back.
	// This is needed because the editor will remove the style tag when the
	// editor switches between desktop to tablet/mobile preview, and sometimes
	// in other processes as well. Just add it back if it's missing.
	useEffect( () => {
		const checkIfStyleTagIsPresent = debounce( () => {
			if ( styleTagRef.current && ! getEditorEl()?.contains( styleTagRef.current ) ) {
				getEditorEl()?.appendChild( styleTagRef.current )
			}
		}, 50 )

		const observer = new MutationObserver( () => {
			checkIfStyleTagIsPresent()
		} )

		observer.observe( document.body, { subtree: true, childList: true } )

		return () => {
			observer.disconnect()
			// We have to do this in a timeout because our debounce above might
			// add it back.
			setTimeout( () => {
				styleTagRef.current?.remove()
			}, 60 )
		}
	}, [] )

	// Initialize the style tag where we will put the styles in.
	useEffect( () => {
		if ( getEditorEl() && ! styleTagRef.current ) {
			styleTagRef.current = document.createElement( 'style' )
			styleTagRef.current.type = 'text/css'
			styleTagRef.current.setAttribute( 'class', 'interact-action-starting-states' )
			getEditorEl().appendChild( styleTagRef.current )
		}

		if ( styleTagRef.current ) {
			styleTagRef.current.innerHTML = style
		}
	}, [ style ] )
}
