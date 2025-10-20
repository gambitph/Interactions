<?php
/**
 * Interaction Type: Enter Viewport
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Enter_Viewport' ) ) {
	class Interact_Interaction_Type_Enter_Viewport extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'enterViewport';
			$this->type = 'element';
			$this->category = 'entrance';

			$this->label = __( 'Entered into viewport', 'interactions' );
			$this->description = __( 'Define actions that happen when an element enters the viewport', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Entered Viewport Actions', 'interactions' ),
					'slug' => 'enter',
					'description' => '',
				],
				[
					'title' => __( 'Exited Viewport Actions', 'interactions' ),
					'slug' => 'exit',
					'description' => '',
				],
			];
			$this->timeline_type = 'time'; // time, percentage.

			$this->options = [
				[
					'label' => __( 'Threshold', 'interactions' ),
					'name' => 'threshold',
					'type' => 'number',
					'help' => __( 'The amount of the element that is visible until the actions get triggered. 0.0 to 1.0', 'interactions' ),
					'placeholder' => '0.3',
					'min' => '0',
					'max' => '1',
					'step' => '0.01',
				],
			];
		}
	}

	interact_add_interaction_type( 'enterViewport', 'Interact_Interaction_Type_Enter_Viewport' );
}
