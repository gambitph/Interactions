/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	textColor: {
		initAction: action => {
			action.initActionAnimation( {
				color: action.getValue( 'color' ),
			} )
		},
		// TODO: We need to move this to PHP or else we will eventually have a TON of these.
		blockElementSelector: ( selector, targetBlock ) => {
			if ( targetBlock.isBlock( 'core/button' ) ) {
				return `${ selector } > .wp-element-button`
			} else if ( targetBlock.isBlock( 'stackable/button' ) ) {
				return `${ selector } .stk-button__inner-text`
			}
			return selector
		},
		initialStyles: action => {
			return `color: ${ action.getValue( 'color' ) };`
		},
	},
} )
