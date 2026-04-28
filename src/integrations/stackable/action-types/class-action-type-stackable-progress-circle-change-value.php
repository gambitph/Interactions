<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Stackable_Progress_Circle_Change_Value' ) ) {
	class Interact_Action_Type_Stackable_Progress_Circle_Change_Value extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'stackableProgressCircleChangeValue';
			$this->category = 'stackable';
			$this->type = 'time';

			$this->label = __( 'Stackable Progress Circle Change Value', 'interactions' );
			$this->description = __( 'Change the value of a Stackable Progress Circle', 'interactions' );

			$this->keywords = [];

			$this->properties = [
				'value' => [
					'name' => __( 'Value', 'interactions' ),
					'type' => 'number',
					'default' => 100,
					'min' => 0,
					'max' => 100,
					'step' => 1,
					'help' => __( 'The value to change into.', 'interactions' ),
				],
			];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'stackableProgressCircleChangeValue', 'Interact_Action_Type_Stackable_Progress_Circle_Change_Value' );
}
