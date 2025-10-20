/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element'

const useWithShift = () => {
	const [ isShiftKey, setIsShiftKey ] = useState( false )

	useEffect( () => {
		const handleShiftKeyToggle = event => {
			setIsShiftKey( !! event.shiftKey )
		}

		window?.addEventListener( 'keydown', handleShiftKeyToggle )
		window?.addEventListener( 'keyup', handleShiftKeyToggle )
		window?.addEventListener( 'focus', handleShiftKeyToggle )

		return () => {
			window?.removeEventListener( 'keydown', handleShiftKeyToggle )
			window?.removeEventListener( 'keyup', handleShiftKeyToggle )
			window?.removeEventListener( 'focus', handleShiftKeyToggle )
		}
	}, [] )

	return isShiftKey
}

export default useWithShift
