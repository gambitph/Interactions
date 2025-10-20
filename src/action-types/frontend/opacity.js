/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	opacity: {
		initAction: action => {
			action.initActionAnimation( {
				opacity: action.getValue( 'opacity' ),
			} )
		},
		initialStyles: action => {
			return `opacity: ${ action.getValue( 'opacity' ) };`
		},
	},
} )
