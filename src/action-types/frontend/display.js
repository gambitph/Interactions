/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	display: {
		initAction: action => {
			action.initActionAnimation( {
				display: action.getValue( 'display' ),
			} )
		},
		initialStyles: action => {
			return `display: ${ action.getValue( 'display' ) };`
		},
	},
} )
