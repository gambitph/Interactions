// Listens to whether the post is about to be previewed or published and stops
// it.
import { useEffect, useRef } from '@wordpress/element'

const useOnPostPreview = postSaveCallback => {
	const previewButtonDone = useRef( false )

	useEffect( () => {
		/**
		 * Previewing the post
		 */

		// Use Mutation Observer to check if the preview button
		// .editor-preview-dropdown__button-external is present then add an
		// event listener to it
		const header = document.querySelector( '.interface-interface-skeleton__header' )
		if ( ! header ) {
			return
		}

		const observer = new MutationObserver( () => {
			if ( ! previewButtonDone.current ) {
				const previewButton = document.querySelector( '.editor-preview-dropdown__button-external' )
				if ( ! previewButton ) {
					return
				}
				previewButtonDone.current = true

				const handler = event => {
					// Create a function that would mimic the click event of the preview button.
					const clonedPreviewButton = previewButton.cloneNode( true )
					const goPreview = () => clonedPreviewButton.click()

					// Call the postSaveCallback function and let it containue the preview
					const stopPreview = postSaveCallback( goPreview )

					// If the postSaveCallback function returns true, stop the preview
					// it's up to the postSaveCallback function to call the preview.
					if ( stopPreview ) {
						previewButton.removeEventListener( 'click', handler )
						event.stopImmediatePropagation()
						event.preventDefault()
					}
				}

				previewButton.addEventListener( 'click', handler )
			}
		} )

		observer.observe( document.body, { childList: true, subtree: true } )

		/**
		 * Publishing the post
		 */
		const publishButton = document.querySelector( '.editor-post-publish-button__button' )
		const publishHandler = event => {
			const goPublish = () => publishButton.click()

			const stopPublish = postSaveCallback( goPublish )
			if ( stopPublish ) {
				event.stopImmediatePropagation()
				event.preventDefault()
			}
		}
		if ( publishButton ) {
			publishButton.addEventListener( 'click', publishHandler )
		}

		return () => {
			observer.disconnect()
			publishButton?.removeEventListener( 'click', publishHandler )
		}
	}, [ postSaveCallback ] )
}

export default useOnPostPreview
