/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	pageLoad: {
		initTimeline: interaction => {
			let timeline = null

			const callback = () => {
				// Destroy existing timeline if there is one.
				timeline?.destroy( false )

				// Create and play the interaction timeline (index 0).
				timeline = interaction.createTimelineInstance( 0 )
				timeline?.play()
			}

			if ( typeof document === 'undefined' ) {
				return
			}

			if (
				document.readyState === 'complete' || // DOMContentLoaded + Images/Styles/etc loaded, so we call directly.
				document.readyState === 'interactive' // DOMContentLoaded fires at this point, so we call directly.
			) {
				callback()
			} else {
				// DOMContentLoaded has not fired yet, delay callback until then.
				document.addEventListener( 'DOMContentLoaded', callback )
			}

			// Return a function that can reset and remove the interaction.
			return () => {
				timeline?.destroy()
			}
		},
	},
} )
