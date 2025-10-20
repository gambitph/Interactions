/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	visibility: {
		initAction: action => {
			action.initActionFunction( () => {
				const visibility = action.getValue( 'visibility' )

				const doShow = el => {
					el.removeAttribute( 'hidden' )
					el.setAttribute( 'aria-hidden', false )
					el.style.removeProperty( 'display' )
				}
				const doHide = el => {
					el.setAttribute( 'hidden', true )
					el.setAttribute( 'aria-hidden', true )
					el.style.setProperty( 'display', 'none', 'important' )
				}

				action.getTargets().forEach( el => {
					const currentlyHidden = el.hasAttribute( 'hidden' )
					if ( visibility === 'toggle' ) {
						if ( currentlyHidden ) {
							doShow( el )
						} else {
							doHide( el )
						}
					} else if ( visibility === 'show' && currentlyHidden ) {
						doShow( el )
					} else if ( visibility === 'hide' && ! currentlyHidden ) {
						doHide( el )
					}
				} )
			} )
		},

		// We need to have initial styles so that the hidden element won't blink
		// before the script runs.
		initialStyles: action => {
			const visibility = action.getValue( 'visibility' )
			if ( visibility === 'hide' || visibility === 'toggle' ) {
				return `display: none !important;`
			}
		},

		runInitialScript: ( action, targetEls ) => {
			const visibility = action.getValue( 'visibility' )

			targetEls.forEach( el => {
				const doShow = el => {
					el.removeAttribute( 'hidden' )
					el.setAttribute( 'aria-hidden', false )
					el.style.removeProperty( 'display' )
				}
				const doHide = el => {
					el.setAttribute( 'hidden', true )
					el.setAttribute( 'aria-hidden', true )
					el.style.setProperty( 'display', 'none', 'important' )
				}

				const currentlyHidden = el.hasAttribute( 'hidden' )
				if ( visibility === 'toggle' ) {
					if ( currentlyHidden ) {
						doShow( el )
					} else {
						doHide( el )
					}
				} else if ( visibility === 'show' && currentlyHidden ) {
					doShow( el )
				} else if ( visibility === 'hide' && ! currentlyHidden ) {
					doHide( el )
				}
			} )

			// We need to remove the starting styles so that the element can be shown/hidden
			action.removeStartingStyles()
		},
	},
} )
