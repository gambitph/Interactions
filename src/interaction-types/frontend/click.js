/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	click: {
		initTimeline: interaction => {
			const preventDefault = interaction.getOption( 'preventDefault', false )
			const addButtonRole = interaction.getOption( 'buttonRole', false )
			const hasMultipleTriggers = interaction.getTriggers().length > 1

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

				timeline?.destroy( false )

				timeline = interaction.createTimelineInstance( 0 )
				timeline?.play()

				// If matching multiple triggers, set clicked one as aria-selected
				if ( hasMultipleTriggers ) {
					interaction.getTriggers().forEach( el => {
						el.setAttribute( 'aria-selected', 'false' )
					} )
					interaction.getCurrentTrigger().setAttribute( 'aria-selected', 'true' )
				}
			}

			const el = interaction.getCurrentTrigger()
			if ( addButtonRole ) {
				el.setAttribute( 'role', 'button' )
				el.setAttribute( 'tabindex', '0' )
			}
			el.addEventListener( 'click', handler )
			el.addEventListener( 'keydown', handler )

			// If matching multiple triggers, set the first one as selected.
			if ( hasMultipleTriggers ) {
				el.setAttribute( 'aria-selected', interaction.getTriggers()[ 0 ] === el ? 'true' : 'false' )
			}

			// Return a function that can reset and remove the interaction.
			return () => {
				timeline?.destroy()
				const el = interaction.getCurrentTrigger()
				el.removeEventListener( 'click', handler )
				el.removeEventListener( 'keydown', handler )
			}
		},
	},
} )
