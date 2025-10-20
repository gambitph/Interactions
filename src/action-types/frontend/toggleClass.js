/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	toggleClass: {
		initAction: action => {
			action.initActionFunction( () => {
				const className = action.getValue( 'class' )
				const toggleAction = action.getValue( 'action' )
				if ( ! className ) {
					return
				}
				action.getTargets().forEach( el => {
					if ( toggleAction === 'toggle' ) {
						el.classList.toggle( className )
					} else if ( toggleAction === 'add' ) {
						el.classList.add( className )
					} else if ( toggleAction === 'remove' ) {
						el.classList.remove( className )
					}
				} )
			} )
		},
	},
} )
