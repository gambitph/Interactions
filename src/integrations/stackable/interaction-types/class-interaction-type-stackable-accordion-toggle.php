<?php
/**
 * Interaction Type: Stackable Accordion Toggle
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Stackable_Accordion_Toggle' ) ) {
	class Interact_Interaction_Type_Stackable_Accordion_Toggle extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'stackableAccordionToggle';
			$this->type = 'element';
			$this->category = 'stackable';

			$this->label = __( 'Stackable Accordion Toggle', 'interactions' );
			$this->description = __( 'Define actions that happen when you toggle the accordion', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Toggle Actions', 'interactions' ),
					'slug' => 'accordion',
					'description' => '',
				],
			];
			$this->timeline_type = 'time';

			$this->options = [
				[
					'label' => __( 'When to apply actions', 'interactions' ),
					'name' => 'stateAction',
					'type' => 'select',
					'options' => [
						[ 'label' => __( 'Toggle (both Open & Close)', 'interactions' ), 'value' => 'toggle' ],
						[ 'label' => __( 'Open', 'interactions' ), 'value' => 'open' ],
						[ 'label' => __( 'Close', 'interactions' ), 'value' => 'close' ],
					],
					'default' => 'toggle',
					'help' => __( 'The state of the accordion when the actions are executed', 'interactions' ),
				],
			];
		}
	}

	interact_add_interaction_type( 'stackableAccordionToggle', 'Interact_Interaction_Type_Stackable_Accordion_Toggle' );
}
