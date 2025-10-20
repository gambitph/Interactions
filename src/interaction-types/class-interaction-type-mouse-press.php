<?php
/**
 * Interaction Type: Mouse Press
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Mouse_Press' ) ) {
	class Interact_Interaction_Type_Mouse_Press extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'mousePress';
			$this->type = 'element';
			$this->category = 'mouse';

			$this->label = __( 'Mouse down and release', 'interactions' );
			$this->description = __( 'Define actions that happen when you press or release your mouse on an element', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Mouse Down Actions', 'interactions' ),
					'slug' => 'down',
					'description' => '',
				],
				[
					'title' => __( 'Mouse Up Actions', 'interactions' ),
					'slug' => 'up',
					'description' => '',
				],
			];
			$this->timeline_type = 'time'; // time, percentage.

			$this->options = [
				[
					// Translators: %s is an action, like 'click'.
					'label' => sprintf( __( 'Prevent default %s behavior', 'interactions' ), __( 'press', 'interactions' ) ),
					'name' => 'preventDefault',
					'type' => 'toggle',
				],
			];
		}
	}

	interact_add_interaction_type( 'mousePress', 'Interact_Interaction_Type_Mouse_Press' );
}
