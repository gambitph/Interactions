<?php
/**
 * Interaction Type: Element Scrolling
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Element_Scrolling' ) ) {
	class Interact_Interaction_Type_Element_Scrolling extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'elementScrolling';
			$this->type = 'element';
			$this->category = 'entrance';

			$this->label = __( 'While scrolling within viewport', 'interactions' );
			$this->description = __( 'Define actions that happen while scrolling when the element is visible.', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Scrolling Actions', 'interactions' ),
					'slug' => 'scroll',
					'description' => '',
				],
			];

			$this->options = [
				[
					'label' => __( 'Smoothness', 'interactions' ),
					'name' => 'smoothness',
					'type' => 'number',
					'placeholder' => '200',
					'min' => 0,
					'help' => __( 'Adjust smoothness. 0 for immediate effect, increase for slower transitions', 'interactions' ),
				],
				[
					'label' => __( 'Offset', 'interactions' ),
					'name' => 'offset',
					'type' => 'number',
					'placeholder' => '0',
					'help' => __( 'Adjust the bounds. A positive offset means start counting earlier and finish later. Negative offset means start counting later and finish sooner.', 'interactions' ),
				],
			];

			$this->timeline_type = 'percentage'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'elementScrolling', 'Interact_Interaction_Type_Element_Scrolling' );
}
