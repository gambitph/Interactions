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
	elementScrolling: {
		initTimeline: ( timeline, interaction ) => {
			const smoothness = interaction.getOption( 'smoothness', 200 )
			const offset = parseFloat( interaction.getOption( 'offset', 0 ) )
			const trigger = interaction.getCurrentTrigger()

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
				const iframe = ev.target?.scrollingElement || ev.target

				// If inside an iframe, use the height of iframe,
				// otherwise use window.innerHeight to get the viewport height.
				const viewportHeight = iframe?.clientHeight || window.innerHeight
				const rect = trigger.getBoundingClientRect()

				// Distance scrolled from the top of the viewport to the top of the element.
				// 0 when the top of the element offset is at the bottom of the screen.
				// 1 when the bottom of the element is at the top of the screen.
				// Positive offset means start counting earlier and finish later, expanding the bounds.
				// Negative offset means start counting later and finish sooner, contracting the bounds.
				const elementScroll = viewportHeight - rect.top + offset
				const totalScroll = viewportHeight + rect.height + ( offset * 2 )
				const scrolled = elementScroll / totalScroll

				// Clamp between 0 and 1
				const clampedScrolled = Math.max( 0, Math.min( 1, scrolled ) )
				timeline.seekPercentage( clampedScrolled, isFirstCall === true ? 0 : smoothness )
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
