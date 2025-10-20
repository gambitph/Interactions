/**
 * This is the editor script for initializing the live preview of this
 * interaction.  This will be in-charge of seeking the animation during the live
 * preview.
 *
 * The difference between this and the frontend script is that this will not
 * need to create the timeline, the job here is only to seek while in the
 * editor.
 */
InteractRunner.addInteractionEditorConfig( {
	pageScrolling: {
		initTimeline: ( timeline, interaction ) => {
			const smoothness = interaction.getOption( 'smoothness', 200 )

			// editorDom is inside an iframe, get it
			const editorDom = interaction.getRunner().getDocument()

			let scrollableEl = null
			if ( editorDom.tagName === 'BODY' ) {
				// If iframed, then
				scrollableEl = editorDom.ownerDocument
			} else {
				// Check if parentEl is an html tag, if not it means we are using a
				// non-iframed editor.
				scrollableEl = editorDom.closest( '.interface-navigable-region' )
			}

			const scrollHandler = ( ev, isFirstCall = false ) => {
				// If iframed, we need to use the scrollingElement of the iframe
				const el = ev.target.scrollingElement || ev.target

				const winScroll = el.scrollTop
				const height = el.scrollHeight - el.clientHeight
				const scrolled = winScroll / height
				timeline.seekPercentage( scrolled, isFirstCall === true ? 0 : smoothness )
			}

			if ( scrollableEl ) {
				scrollableEl.addEventListener( 'scroll', scrollHandler )
				setTimeout( () => {
					scrollHandler( { target: scrollableEl }, true ) // Trigger once
				} )
			}

			return () => {
				if ( scrollableEl ) {
					scrollableEl.removeEventListener( 'scroll', scrollHandler )
				}
			}
		},
	},
} )
