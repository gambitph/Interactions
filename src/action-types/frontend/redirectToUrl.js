/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	redirectToUrl: {
		initAction: action => {
			action.initActionFunction( () => {
				window.location.href = action.getValue( 'url' )
			} )
		},
	},
} )
