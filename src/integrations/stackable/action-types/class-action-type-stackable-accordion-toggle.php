<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Stackable_Accordion_Toggle' ) ) {
	class Interact_Action_Type_Stackable_Accordion_Toggle extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'stackableAccordionToggle';
			$this->category = 'stackable';
			$this->type = 'time';

			$this->label = __( 'Stackable Accordion Toggle', 'interactions' );
			$this->description = __( 'Toggle a Stackable Accordion', 'interactions' );

			$this->keywords = [];

			$this->properties = [
				'stateAction' => [
					'name' => __( 'What action to apply', 'interactions' ),
					'type' => 'select',
					'default' => 'toggle',
					'options' => [
						[ 'label' => __( 'Toggle (both Open & Close)', 'interactions' ), 'value' => 'toggle' ],
						[ 'label' => __( 'Open', 'interactions' ), 'value' => 'open' ],
						[ 'label' => __( 'Close', 'interactions' ), 'value' => 'close' ],
					],
				],
			];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'stackableAccordionToggle', 'Interact_Action_Type_Stackable_Accordion_Toggle' );
}
