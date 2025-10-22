import { __ } from '@wordpress/i18n'
import { createInterpolateElement } from '@wordpress/element'

export const editor = {
	hasConfetti: false,
	steps: [
		{
			title: '👋 ' + __( 'Welcome to Interactions', 'interactions' ),
			description: __( 'Transform your WordPress site with animations and dynamic interactions that bring your content to life. Let’s get started by exploring the Interaction Library.', 'interactions' ),
			help: createInterpolateElement( __( 'Click the <strong>Interactions</strong> button to continue.', 'interactions' ), {
				strong: <strong />,
			} ),
			anchor: '.interact-insert-library-button',
			position: 'bottom',
			nextEventTarget: '.interact-insert-library-button',
			glowTarget: '.interact-insert-library-button',
			showNext: false,
		},
	],
}
