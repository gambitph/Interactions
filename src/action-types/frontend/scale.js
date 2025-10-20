/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	scale: {
		initAction: action => {
			action.initActionAnimation( {
				scaleX: action.getValue( 'x' ),
				scaleY: action.getValue( 'y' ),
			} )
		},
		initialStyles: action => {
			return `transform: scaleX(${ action.getValue( 'x' ) }) scaleY(${ action.getValue( 'y' ) });`
		},
	},
} )
