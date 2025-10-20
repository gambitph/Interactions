/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	focus: {
		initAction: action => {
			action.initActionFunction( () => {
				const targets = action.getTargets()
				if ( targets.length ) {
					const element = targets[ 0 ]
					if ( element.focus ) {
						try {
							element.focus()
						} catch ( e ) {
							// The element is not focusable
						}
					}

					// The element is not focusable, find the first focusable child
					// eslint-disable-next-line @wordpress/no-global-active-element
					if ( document.activeElement !== element ) {
						const focusableChild = element.querySelector( 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])' )
						if ( focusableChild ) {
							focusableChild.focus()
						}
					}
				}
			} )
		},
	},
} )
