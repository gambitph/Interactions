<?php
/**
 * Interaction Type: Keypress
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Keypress' ) ) {
	class Interact_Interaction_Type_Keypress extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'keypress';
			$this->type = 'element';
			$this->category = 'keyboard';

			$this->label = __( 'Key press and release', 'interactions' );
			$this->description = __( 'Define actions that happen when a key is pressed or released', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Key Down Actions', 'interactions' ),
					'slug' => 'down',
					'description' => '',
				],
				[
					'title' => __( 'Key Up Actions', 'interactions' ),
					'slug' => 'up',
					'description' => '',
				],
			];
			$this->timeline_type = 'time'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'keypress', 'Interact_Interaction_Type_Keypress' );
}
