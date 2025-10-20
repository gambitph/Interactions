<?php
/**
 * Interaction Type: Mouse Move
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Mouse_Move' ) ) {
	class Interact_Interaction_Type_Mouse_Move extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'mouseMove';
			$this->type = 'page';
			$this->category = 'mouse';

			$this->label = __( 'Mouse move in viewport', 'interactions' );
			$this->description = __( 'Define actions that happen while the mouse is moving in the viewport', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Move X Actions', 'interactions' ),
					'slug' => 'x',
					'description' => '',
				],
				[
					'title' => __( 'Move Y Actions', 'interactions' ),
					'slug' => 'y',
					'description' => '',
				],
			];
			$this->timeline_type = 'percentage'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'mouseMove', 'Interact_Interaction_Type_Mouse_Move' );
}
