/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	rotate: {
		initAction: action => {
			const transformOrigin = action.getValue( 'transformOrigin' )

			action.initActionAnimation( {
				onBegin: () => {
					action.getTargets().forEach( el => {
						el.style.transformOrigin = transformOrigin === 'custom'
							? action.getValue( 'customTransformOrigin' )
							: transformOrigin
					} )
				},
				rotate: action.getValue( 'rotate' ),
			} )
		},
		initialStyles: action => {
			const transformOrigin = action.getValue( 'transformOrigin' )
			return `
				transform-origin: ${ transformOrigin === 'custom' ? action.getValue( 'customTransformOrigin' ) : transformOrigin };
				transform: rotate(${ action.getValue( 'rotate' ) }deg);
			`
		},
	},
} )
