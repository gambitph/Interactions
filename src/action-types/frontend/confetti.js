/**
 * This is the frontend script loaded in the frontend if the action is used.
 */

const LOCATION_MAP = {
	center: { x: 0.5, y: 0.60 },
	top: { x: 0.5, y: 0.10 },
	bottom: { x: 0.5, y: 0.90 },
	left: { x: 0.10, y: 0.5 },
	right: { x: 0.90, y: 0.5 },
	'top-left': { x: 0.10, y: 0.10 },
	'top-right': { x: 0.90, y: 0.10 },
	'bottom-left': { x: 0.10, y: 0.90 },
	'bottom-right': { x: 0.90, y: 0.90 },
}

InteractRunner.addActionConfig( {
	confetti: {
		initAction: action => {
			action.initActionFunction( () => {
				const location = action.getValue( 'location' ) || 'center'

				const targets = action.getTargets()
				let targetEl = targets.length ? targets[ 0 ] : window

				// If the target is not visible, use the window
				if ( targetEl.clientHeight === 0 && targetEl.clientWidth === 0 ) {
					targetEl = window
				}

				let origin = { x: 0.5, y: 0.60 }
				const pos = LOCATION_MAP[ location ] || LOCATION_MAP.center

				if ( targetEl !== window && targetEl !== document ) {
					// Get the percentage of the center of the target element to the screen width
					const rect = targetEl.getBoundingClientRect()
					origin.x = ( rect.left + ( rect.width * pos.x ) ) / window.innerWidth
					origin.y = ( rect.top + ( rect.height * pos.y ) ) / window.innerHeight
				} else {
					origin = pos
				}

				window.interactions.confetti( origin )
			} )
		},
	},
} )
