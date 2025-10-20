import { __ } from '@wordpress/i18n'

export const getInteractionWarning = ( interaction, type ) => {
	if ( type === 'element' ) {
		if ( ! interaction.target?.value ) {
			return {
				type: 'no-trigger',
				message: __( 'Error: This field is required. Please enter an interaction trigger.', 'interactions' ),
			}
		}
	}
	return null
}
