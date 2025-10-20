/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element'

const isApple = () => {
	return /Mac|iPod|iPhone|iPad/i.test( window.navigator?.platform || '' )
}

const NOOP = () => {}

const useWithOnShortcut = props => {
	const {
		onCopy = NOOP,
		onPaste = NOOP,
		onDelete = NOOP,
		onSelectAll = NOOP,
		onEscape = NOOP,
	} = props

	useEffect( () => {
		const handleShortcut = event => {
			// If in an input, do not trigger shortcuts.
			if ( event.target.closest( 'input' ) ) {
				return
			}

			const isControlKey = isApple() ? event.metaKey : event.ctrlKey
			if ( event.key === 'c' && isControlKey && onCopy ) {
				onCopy( event )
			}
			if ( event.key === 'v' && isControlKey && onPaste ) {
				onPaste( event )
			}
			if ( event.key === 'Delete' || event.key === 'Backspace' ) {
				onDelete( event )
			}
			if ( event.key === 'a' && isControlKey ) {
				onSelectAll( event )
			}
			if ( event.key === 'Escape' ) {
				onEscape( event )
			}
		}

		window?.addEventListener( 'keydown', handleShortcut )
		window?.addEventListener( 'keyup', handleShortcut )

		return () => {
			window?.removeEventListener( 'keydown', handleShortcut )
			window?.removeEventListener( 'keyup', handleShortcut )
		}
	}, [ onCopy, onPaste, onDelete, onSelectAll, onEscape ] )
}

export default useWithOnShortcut
