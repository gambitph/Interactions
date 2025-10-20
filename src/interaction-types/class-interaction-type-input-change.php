<?php
/**
 * Interaction Type: Input Change
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Input_Change' ) ) {
	class Interact_Interaction_Type_Input_Change extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'inputChange';
			$this->type = 'element';
			$this->category = 'keyboard';

			$this->label = __( 'Input change', 'interactions' );
			$this->description = __( 'Define actions that happen when an input changes', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Input Change Actions', 'interactions' ),
					'slug' => 'change',
					'description' => '',
				],
				[
					'title' => __( 'Input Blur Actions', 'interactions' ),
					'slug' => 'blur',
					'description' => '',
				],
			];
			$this->timeline_type = 'time'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'inputChange', 'Interact_Interaction_Type_Input_Change' );
}
