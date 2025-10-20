/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	mousePress: {
		initTimeline: interaction => {
			const preventDefault = interaction.getOption( 'preventDefault', false )

			let timelinePointerDown = null
			let timelinePointerUp = null
			let isDown = false

			const pointerDownHandler = ev => {
				if ( preventDefault ) {
					ev.preventDefault()
				}

				isDown = true

				if ( interaction.timelines[ 0 ].hasActions ) {
					ev.preventDefault()

					// Destroy existing timeline if there is one.
					timelinePointerUp?.destroy( false )
					timelinePointerDown?.destroy( false )

					// Create and play the interaction timeline (index 0).
					timelinePointerDown = interaction.createTimelineInstance( 0 )
					timelinePointerDown?.play()
				}
			}

			const playUpTimeline = () => {
				isDown = false
				if ( interaction.timelines[ 1 ].hasActions ) {
					// Destroy existing timeline if there is one.
					timelinePointerUp?.destroy( false )
					timelinePointerDown?.destroy( false )

					// Create and play the interaction timeline (index 1).
					timelinePointerUp = interaction.createTimelineInstance( 1 )
					timelinePointerUp?.play()
				}
			}

			// When the mouse is released on the element, or was cancelled.
			const pointerUpHandler = ev => {
				if ( ! isDown ) {
					return
				}
				if ( preventDefault ) {
					ev.preventDefault()
				}
				playUpTimeline()
			}

			// Also handle when the mouse is released outside the element.
			const windowPointerUpHandler = () => {
				if ( isDown ) {
					playUpTimeline()
				}
			}

			const trigger = interaction.getCurrentTrigger()
			trigger.addEventListener( 'pointerdown', pointerDownHandler )
			trigger.addEventListener( 'pointerup', pointerUpHandler )
			trigger.addEventListener( 'pointercancel', pointerUpHandler )
			document.addEventListener( 'pointerup', windowPointerUpHandler )

			// Return a function that can reset and remove the interaction.
			return () => {
				timelinePointerDown?.destroy()
				timelinePointerUp?.destroy()
				trigger.removeEventListener( 'pointerdown', pointerDownHandler )
				trigger.removeEventListener( 'pointerup', pointerUpHandler )
				trigger.removeEventListener( 'pointercancel', pointerUpHandler )
				document.removeEventListener( 'pointerup', windowPointerUpHandler )
			}
		},
	},
} )
