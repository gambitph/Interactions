/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element'

const isApple = () => {
	return /Mac|iPod|iPhone|iPad/i.test( window.navigator?.platform || '' )
}

const useWithControl = () => {
	const [ isControlKey, setIsControlKey ] = useState( false )

	useEffect( () => {
		const handleControlKeyToggle = event => {
			setIsControlKey( !! ( isApple() ? event.metaKey : event.ctrlKey ) )
		}

		window?.addEventListener( 'keydown', handleControlKeyToggle )
		window?.addEventListener( 'keyup', handleControlKeyToggle )
		window?.addEventListener( 'focus', handleControlKeyToggle )

		return () => {
			window?.removeEventListener( 'keydown', handleControlKeyToggle )
			window?.removeEventListener( 'keyup', handleControlKeyToggle )
			window?.removeEventListener( 'focus', handleControlKeyToggle )
		}
	}, [] )

	return isControlKey
}

export default useWithControl
