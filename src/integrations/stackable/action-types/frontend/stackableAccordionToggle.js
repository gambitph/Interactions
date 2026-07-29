/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableAccordionToggle: {
		initAction: action => {
			action.initActionFunction( () => {
				const stateAction = action.getValue( 'stateAction' ) || 'toggle'

				action.getTargets().forEach( el => {
					// Do not proceed if the target is not a Stackable Accordion
					if ( ! el.classList?.contains( 'wp-block-stackable-accordion' ) ) {
						return
					}

					switch ( stateAction ) {
						case 'toggle':
							el.open = ! el.open
							break
						case 'open':
							el.open = true
							break
						case 'close':
							el.open = false
							break
					}
				} )
			} )
		},
	},
} )
