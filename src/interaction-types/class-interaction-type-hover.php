<?php
/**
 * Interaction Type: Hover
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Hover' ) ) {
	class Interact_Interaction_Type_Hover extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'hover';
			$this->type = 'element';
			$this->category = 'mouse';

			$this->label = __( 'Mouse hover', 'interactions' );
			$this->description = __( 'Define actions that happen when your mouse hovers in or out of an element', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'On Hover Actions', 'interactions' ),
					'slug' => 'in',
					'description' => '',
				],
				[
					'title' => __( 'On Hover Out Actions', 'interactions' ),
					'slug' => 'out',
					'description' => '',
				],
			];
			$this->timeline_type = 'time'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'hover', 'Interact_Interaction_Type_Hover' );
}
