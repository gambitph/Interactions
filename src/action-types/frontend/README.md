# Action Type frontend script

Each action type needs its own frontend script. This contains the configuration
for the action in the frontend.

This is also used in the backend to preview the action.

# Usage

The `action` object passed is an instance of `src/frontend/scripts/class-action.js`

```js
/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	opacity: {
		initAction: action => {
			action.initActionAnimation( {
				opacity: action.getValue( 'opacity' ),
			} )
			action.initActionFunction( () => {
			} )
		},
		// Can return a string of CSS styles to apply to the element as its initial state
		initialStyles: action => {
			return `opacity: ${ action.getValue( 'opacity' ) };`
		},
		blockElementSelector: ( selector, targetBlock ) => {
			// For the cover block, the target is the background element.
			if ( targetBlock.isBlock( 'core/cover' ) ) {
				return `${ selector } > .wp-block-cover__background`
			} else if ( targetBlock.isBlock( 'core/button' ) ) {
				return `${ selector } > .wp-element-button`
			}
			return selector
		},
		runInitialScript: ( action, targetEls ) => {
			const visibility = actionData.getValue( 'visibility' )
			action.getTargets().forEach( el => {
				if ( visibility === 'hide' ) {
					el.style.opacity = 0
				} else {
					el.style.opacity = 1
				}
			} )
		},
	},
} )
```
