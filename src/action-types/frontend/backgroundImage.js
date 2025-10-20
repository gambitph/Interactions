/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	backgroundImage: {
		initAction: action => {
			action.initActionAnimation( {
				backgroundImage: `url(${ action.getValue( 'image' ) })`,
			} )
		},
		initialStyles: action => {
			return `background-image: url(${ action.getValue( 'image' ) });`
		},
	},
} )
