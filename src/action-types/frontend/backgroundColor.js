/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	backgroundColor: {
		initAction: action => {
			action.initActionAnimation( {
				backgroundColor: action.getValue( 'color' ),
			} )
		},
		// TODO: We need to move this to PHP or else we will eventually have a TON of these.
		blockElementSelector: ( selector, targetBlock ) => {
			// For the cover block, the target is the background element.
			if ( targetBlock.isBlock( 'core/cover' ) ) {
				return `${ selector } > .wp-block-cover__background`
			} else if ( targetBlock.isBlock( 'core/button' ) ) {
				return `${ selector } > .wp-element-button`
			} else if ( targetBlock.isBlock( 'stackable/button' ) ) {
				return `${ selector } > .stk-button`
			}
			return selector
		},
		initialStyles: action => {
			return `background-color: ${ action.getValue( 'color' ) };`
		},
	},
} )
