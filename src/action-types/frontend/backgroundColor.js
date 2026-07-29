/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

const BACKGROUND_COLOR_TARGET_SELECTORS = {
	'core/cover': [ ' .wp-block-cover__background' ],
	'core/button': [ ' .wp-element-button' ],
	'stackable/blockquote': [ ' .stk-block-blockquote__content' ],
	'stackable/button': [ ' .stk-button' ],
	'stackable/call-to-action': [ ' .stk-block-call-to-action__content' ],
	'stackable/card': [ ' .stk-block-card__content' ],
	'stackable/hero': [ ' .stk-block-hero__content' ],
	'stackable/image-box': [ ' .stk-block-image-box__content' ],
	'stackable/notification': [ ' .stk-block-notification__content' ],
	'stackable/number-box': [ ' .stk-block-number-box__container' ],
	'stackable/pricing-box': [ ' .stk-block-pricing-box__content' ],
	'stackable/testimonial': [ ' .stk-block-testimonial__content' ],
	'stackable/accordion': [
		' .stk-block-accordion__heading',
		' .stk-block-accordion__content',
	],
}

InteractRunner.addActionConfig( {
	backgroundColor: {
		initAction: action => {
			action.initActionAnimation( {
				backgroundColor: action.getValue( 'color' ),
			} )
		},
		// TODO: We need to move this to PHP or else we will eventually have a TON of these.
		blockElementSelectors: ( selector, targetBlock ) => {
			for ( const [ blockName, targetSuffixes ] of Object.entries( BACKGROUND_COLOR_TARGET_SELECTORS ) ) {
				if ( targetBlock.isBlock( blockName ) ) {
					return targetSuffixes.map( suffix => `${ selector }${ suffix }` )
				}
			}
			return [ selector ]
		},
		initialStyles: action => {
			return `background-color: ${ action.getValue( 'color' ) };`
		},
	},
} )
