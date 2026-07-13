import { __ } from '@wordpress/i18n'
import { createInterpolateElement } from '@wordpress/element'

export const interactionLibrary = {
	steps: [
		{
			title: '👋 ' + __( 'Interaction Library', 'interactions' ),
			description: __( 'The Interaction Library contains curated presets for both simple and advanced animations that you can insert in just one click.', 'interactions' ),
			offsetX: '-400px',
		},
		{
			title: __( 'Filtering by Categories', 'interactions' ),
			description: __( 'Quickly find the type of interaction you need by filtering presets by category or using the search bar above.', 'interactions' ),
			help: createInterpolateElement( __( 'Select the <strong>Button</strong> category from the sidebar filter.', 'interactions' ), {
				strong: <strong />,
			} ),
			anchor: '.interact-interaction-library__select__category--button',
			position: 'right',
			nextEventTarget: '.interact-interaction-library__select__category--button',
			glowTarget: '.interact-interaction-library__select__category--button',
			showNext: false,
		},
		{
			title: __( 'Insert or Customize', 'interactions' ),
			description: __( 'You can insert an interaction as-is, or go deeper by customizing its settings.', 'interactions' ),
			help: createInterpolateElement( __( 'Hover over the interaction and click <strong>Customize</strong> on a preset to continue.', 'interactions' ), {
				strong: <strong />,
			} ),
			anchor: '.interact-interaction-library__select__preset-card',
			position: 'bottom',
			nextEventTarget: '.interact-interaction-library__select__preset-card',
			glowTarget: '.interact-interaction-library__select__preset-card',
			offsetY: '-100px',
			showNext: false,
		},
		{
			title: __( 'Customize Section', 'interactions' ),
			description: __( 'Each interaction can be tailored to your needs. Adjust interaction type, triggers, and animation styles with intuitive controls.', 'interactions' ),
			help: createInterpolateElement( __( 'Tweak a few settings and click <strong>Insert</strong>.', 'interactions' ), {
				strong: <strong />,
			} ),
			anchor: '.interact-interaction-library__configure-middle',
			position: 'left',
			nextEventTarget: '.interact-interaction-library__configure__apply-button__button',
			glowTarget: '.interact-interaction-library__configure__apply-button__button',
			offsetY: '200px',
			showNext: false,
		},
	],
}

