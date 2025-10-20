/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	skew: {
		initAction: action => {
			action.initActionAnimation( {
				skewX: action.getValue( 'x' ),
				skewY: action.getValue( 'y' ),
			} )
		},
		initialStyles: action => {
			return `transform: skewX(${ action.getValue( 'x' ) }) skewY(${ action.getValue( 'y' ) });`
		},
	},
} )
