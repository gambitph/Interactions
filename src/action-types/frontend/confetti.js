/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	confetti: {
		initAction: action => {
			action.initActionFunction( () => {
				const origin = { x: 0.5, y: 0.65 }

				const targets = action.getTargets()
				let targetEl = targets.length ? targets[ 0 ] : window

				// If the target is not visible, use the window
				if ( targetEl.clientHeight === 0 && targetEl.clientWidth === 0 ) {
					targetEl = window
				}

				if ( targetEl !== window && targetEl !== document ) {
					// Get the percentage of the center of the target element to the screen width
					const rect = targetEl.getBoundingClientRect()
					origin.x = ( rect.left + ( rect.width / 2 ) ) / window.innerWidth
					origin.y = ( rect.top + ( rect.height / 2 ) + 20 ) / window.innerHeight
				}

				window.interactions.confetti( origin )
			} )
		},
	},
} )
