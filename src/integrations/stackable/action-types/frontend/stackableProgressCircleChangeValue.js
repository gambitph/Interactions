/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableProgressCircleChangeValue: {
		initAction: action => {
			action.initActionFunction( () => {
				const value = String( action.getValue( 'value' ) || 100 )

				action.getTargets().forEach( el => {
					// Do not proceed if the target is not a horizontal scroller
					if ( ! el.classList?.contains( 'wp-block-stackable-progress-circle' ) ) {
						return
					}

					const circle = el.querySelector( '.stk-progress-circle' )
					const text = el.querySelector( '.stk-progress-circle__inner-text' )

					circle.style.setProperty( '--progress-value', value, 'important' )
					text.textContent = value
				} )
			} )
		},
	},
} )
