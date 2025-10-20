<?php
/**
 * Interaction Type: Click
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Click' ) ) {
	class Interact_Interaction_Type_Click extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'click';
			$this->type = 'element';
			$this->category = 'mouse';

			$this->label = __( 'Click', 'interactions' );
			$this->description = __( 'Define actions that happen when you click an element', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Click Actions', 'interactions' ),
					'slug' => 'click',
					'description' => __( 'Do these actions when the element is clicked', 'interactions' ),
				],
			];
			$this->timeline_type = 'time'; // time, percentage.

			$this->options = [
				[
					// Translators: %s is an action, like 'click'.
					'label' => sprintf( __( 'Prevent default %s behavior', 'interactions' ), __( 'click', 'interactions' ) ),
					'name' => 'preventDefault',
					'type' => 'toggle',
				],
				[
					'label' => __( 'Add button role & tabindex', 'interactions' ),
					'name' => 'buttonRole',
					'type' => 'toggle',
				],
			];
		}
	}

	interact_add_interaction_type( 'click', 'Interact_Interaction_Type_Click' );
}
