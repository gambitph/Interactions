/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	updateAttribute: {
		initAction: action => {
			action.initActionFunction( () => {
				const attribute = action.getValue( 'attribute' )
				const value = action.getValue( 'value' )
				const updateAction = action.getValue( 'action' )
				if ( ! attribute ) {
					return
				}
				action.getTargets().forEach( el => {
					if ( updateAction === 'toggle' ) {
						if ( el.getAttribute( attribute ) === value ) {
							el.removeAttribute( attribute )
						} else {
							el.setAttribute( attribute, value )
						}
					} else if ( updateAction === 'update' ) {
						el.setAttribute( attribute, value )
					} else if ( updateAction === 'remove' ) {
						el.removeAttribute( attribute )
					}
				} )
			} )
		},
	},
} )
