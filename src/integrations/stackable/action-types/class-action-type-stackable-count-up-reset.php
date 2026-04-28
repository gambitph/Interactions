<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Stackable_Count_Up_Reset' ) ) {
	class Interact_Action_Type_Stackable_Count_Up_Reset extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'stackableCountUpReset';
			$this->category = 'stackable';
			$this->type = 'time';

			$this->label = __( 'Stackable Count Up Reset', 'interactions' );
			$this->description = __( 'Reset the Stackable Count Up', 'interactions' );

			$this->keywords = [];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'stackableCountUpReset', 'Interact_Action_Type_Stackable_Count_Up_Reset' );
}
