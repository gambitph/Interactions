/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	hover: {
		initTimeline: interaction => {
			let timelineMouseEnter = null
			let timelineMouseLeave = null

			const handlerMouseEnter = ev => {
				if ( interaction.timelines[ 0 ].hasActions ) {
					ev.preventDefault()

					timelineMouseEnter?.destroy( false )
					timelineMouseLeave?.destroy( false )

					// Create and play the interaction timeline (index 0).
					timelineMouseEnter = interaction.createTimelineInstance( 0 )
					timelineMouseEnter?.play()
				}
			}

			const handlerMouseLeave = ev => {
				if ( interaction.timelines[ 1 ].hasActions ) {
					ev.preventDefault()

					timelineMouseEnter?.destroy( false )
					timelineMouseLeave?.destroy( false )

					// Create and play the interaction timeline (index 1).
					timelineMouseLeave = interaction.createTimelineInstance( 1 )
					timelineMouseLeave?.play()
				}
			}

			const trigger = interaction.getCurrentTrigger()
			trigger.addEventListener( 'mouseenter', handlerMouseEnter )
			trigger.addEventListener( 'mouseleave', handlerMouseLeave )

			// Return a function that can reset and remove the interaction.
			return () => {
				timelineMouseLeave?.destroy( false )
				timelineMouseEnter?.destroy( false )
				trigger.removeEventListener( 'mouseenter', handlerMouseEnter )
				trigger.removeEventListener( 'mouseleave', handlerMouseLeave )
			}
		},
	},
} )
