import { domReady } from '~interact/shared/dom-ready.js'
import { useState, createRoot } from '@wordpress/element'
import { ToggleControl } from '@wordpress/components'
import apiFetch from '@wordpress/api-fetch'

const ActiveToggle = props => {
	const [ value, setValue ] = useState( props.value === 'true' )

	return <ToggleControl
		checked={ value }
		onChange={ value => {
			setValue( value )

			apiFetch( {
				path: `/wp/v2/interact-interaction/${ props.postId }`,
				method: 'POST',
				data: { status: value ? 'publish' : 'interact-inactive' },
			} ).catch( res => {
				// eslint-disable-next-line no-alert
				window.alert( props.errorMessage + `\n\n` + res.message )
			} )
		} }
	/>
}

// TODO: When quick editing an interaction, this should re-mount.
domReady( () => {
	document.querySelectorAll( '.interact-interaction-active' ).forEach( el => {
		createRoot( el ).render(
			<ActiveToggle
				postId={ el.dataset.postId }
				value={ el.dataset.value }
				errorMessage={ el.dataset.errorMessage }
			/>
		)
	} )
} )
