/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	toggle: {
		initTimeline: interaction => {
			const preventDefault = interaction.getOption( 'preventDefault', false )
			const addButtonRole = interaction.getOption( 'buttonRole', false )

			let numClicks = 0

			let timeline = null
			const handler = ev => {
				if (
					ev instanceof KeyboardEvent &&
					ev.key !== 'Enter' &&
					ev.key !== ' '
				) {
					return
				}

				if ( preventDefault ) {
					ev.preventDefault()
				}

				const timelineIndex = numClicks++ % 2 === 0 ? 0 : 1
				ev.target.setAttribute( 'aria-pressed', timelineIndex === 0 )

				if ( interaction.timelines[ timelineIndex ].hasActions ) {
					// Destroy existing timeline if there is one.
					timeline?.destroy( false )

					// Create and play the interaction timeline (index timelineIndex).
					timeline = interaction.createTimelineInstance( timelineIndex )
					timeline?.play()
				}
			}

			const trigger = interaction.getCurrentTrigger()
			if ( addButtonRole ) {
				trigger.setAttribute( 'role', 'button' )
				trigger.setAttribute( 'tabindex', '0' )
			}
			trigger.addEventListener( 'click', handler )
			trigger.addEventListener( 'keydown', handler )
			trigger.setAttribute( 'aria-pressed', false )

			// Return a function that can reset and remove the interaction.
			return () => {
				timeline?.destroy()
				trigger.removeEventListener( 'click', handler )
				trigger.removeEventListener( 'keydown', handler )
				trigger.setAttribute( 'aria-pressed', false )
			}
		},
	},
} )
