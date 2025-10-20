<?php
/**
 * Interaction Type: Toggle Class
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Toggle' ) ) {
	class Interact_Interaction_Type_Toggle extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'toggle';
			$this->type = 'element';
			$this->category = 'mouse';

			$this->label = __( 'Click Toggle', 'interactions' );
			$this->description = __( 'Define actions that happen when you click an element on and off', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Toggle On Actions', 'interactions' ),
					'slug' => 'first',
					// Translators: %s is an ordinal number.
					'description' => sprintf( __( 'Do these actions on the %s time', 'interactions' ), __( 'first', 'interactions' ) ),
				],
				[
					'title' => __( 'Toggle Off Actions', 'interactions' ),
					'slug' => 'second',
					// Translators: %s is an ordinal number.
					'description' => sprintf( __( 'Do these actions on the %s time', 'interactions' ), __( 'second', 'interactions' ) ),
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

	interact_add_interaction_type( 'toggle', 'Interact_Interaction_Type_Toggle' );
}
