/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

InteractRunner.addActionConfig( {
	stackableProgressBarChangeValue: {
		initAction: action => {
			action.initActionFunction( () => {
				const value = String( action.getValue( 'value' ) || 100 )

				action.getTargets().forEach( el => {
					// Do not proceed if the target is not a horizontal scroller
					if ( ! el.classList?.contains( 'wp-block-stackable-progress-bar' ) ) {
						return
					}

					const bar = el.querySelector( '.stk-progress-bar__bar' )
					const text = el.querySelector( '.stk-progress-bar__progress-value-text' )

					bar.style.width = `${ value }%`
					text.textContent = value
				} )
			} )
		},
	},
} )
