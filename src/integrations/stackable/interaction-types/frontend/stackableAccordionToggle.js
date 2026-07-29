/**
 * This is the frontend script loaded in the frontend if the interaction is used.
 */
InteractRunner.addInteractionConfig( {
	stackableAccordionToggle: {
		initTimeline: interaction => {
			const stateAction = interaction.getOption( 'stateAction', 'toggle' )

			let timeline = null
			const handler = event => {
				const isOpen = event.newState ? event.newState === 'open' : el.open

				if ( stateAction === 'toggle' ||
					( stateAction === 'open' && isOpen ) ||
					( stateAction === 'close' && ! isOpen ) ) {
					timeline?.destroy( false )

					timeline = interaction.createTimelineInstance( 0 )
					timeline?.play()
				}
			}

			const el = interaction.getCurrentTrigger()

			// Do not proceed if the target is not a Stackable Accordion
			if ( el.classList?.contains( 'wp-block-stackable-accordion' ) ) {
				el.addEventListener( 'toggle', handler )

				return () => {
					timeline?.destroy()
					el.removeEventListener( 'toggle', handler )
				}
			}
		},
	},
} )
