/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableCountUpReset: {
		initAction: action => {
			action.initActionFunction( () => {
				action.getTargets().forEach( el => {
					const text = el.querySelector( '.stk-block-count-up__text' )
					const countUp = text.countUp

					// Do not proceed if the target is not a Stackable Count Up
					if ( ! countUp ) {
						return
					}

					// Re-initialize the count up block
					countUp.init()
				} )
			} )
		},
	},
} )
