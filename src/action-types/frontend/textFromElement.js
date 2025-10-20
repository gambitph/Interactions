/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	textFromElement: {
		initAction: action => {
			action.initActionFunction( () => {
				const targets = action.getTargets()

				if ( targets.length ) {
					const text = targets[ 0 ].innerText
					action.provideData( 'id', text || '' )
				}
			} )
		},
	},
} )
