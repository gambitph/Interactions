/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	cssRule: {
		initAction: action => {
			const property = action.getValue( 'property' )
			const value = () => {
				// Get the value, pass the style name as the context.
				return action.getValue( 'value', action.getValue( 'property' ) )
			}
			// Validate the CSS rule first.
			// Add optional 'px' to allow values without unit which default to px.
			if ( CSS.supports( property, value() ) || CSS.supports( property, value() + 'px' ) ) {
				return action.initActionAnimation( {
					[ property ]: value,
					// This makes sure the value is re-calculated for dynamic values.
					onBegin: self => self.refresh(),
				} )
			}
		},
		initialStyles: action => {
			return `${ action.getValue( 'property' ) }: ${ action.getValue( 'value' ) };`
		},
	},
} )
