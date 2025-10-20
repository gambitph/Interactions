/**
 * This is the frontend script loaded in the frontend if the action is used.
 */
InteractRunner.addActionConfig( {
	move: {
		initAction: action => {
			const x = action.getValue( 'x' )
			const y = action.getValue( 'y' )
			const z = action.getValue( 'z' )

			const values = {}
			if ( x || x === 0 ) {
				values.translateX = x
			}
			if ( y || y === 0 ) {
				values.translateY = y
			}
			// TODO: maybe we need to create a Move 3d action so it can have a perspective?
			if ( z || z === 0 ) {
				values.translateZ = z
			}
			action.initActionAnimation( values )
		},
		initialStyles: action => {
			const x = action.getValue( 'x' )
			const y = action.getValue( 'y' )
			const z = action.getValue( 'z' )

			const values = []
			if ( x || x === 0 ) {
				values.push( `translateX(${ x }px)` )
			}
			if ( y || y === 0 ) {
				values.push( `translateY(${ y }px)` )
			}
			if ( z || z === 0 ) {
				values.push( `translateZ(${ z }px)` )
			}
			if ( values.length === 0 ) {
				return ''
			}
			return `transform: ${ values.join( ' ' ) };`
		},
	},
} )
