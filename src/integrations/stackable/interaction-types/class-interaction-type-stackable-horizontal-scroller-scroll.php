<?php
/**
 * Interaction Type: Stackable Accordion Toggle
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Stackable_Horizontal_Scroller_Scroll' ) ) {
	class Interact_Interaction_Type_Stackable_Horizontal_Scroller_Scroll extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'stackableHorizontalScrollerScroll';
			$this->type = 'element';
			$this->category = 'stackable';

			$this->label = __( 'Stackable Horizontal Scroller Scroll', 'interactions' );
			$this->description = __( 'Define actions that happen when the horizontal scroller is scrolled', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Horizontal Scroller Actions', 'interactions' ),
					'slug' => 'horizontal-scroller',
					'description' => '',
				],
			];
			$this->timeline_type = 'time';

			$this->options = [
				[
					'label' => __( 'Column', 'interactions' ),
					'name' => 'column',
					'type' => 'number',
					'default' => '',
					'min' => 1,
					'max' => 10,
					'step' => 1,
					'help' => __( 'When the horizontal scroller changes into this column number, trigger the actions. Leave this blank to trigger when scrolled', 'interactions' ),
				],
			];
		}
	}

	interact_add_interaction_type( 'stackableHorizontalScrollerScroll', 'Interact_Interaction_Type_Stackable_Horizontal_Scroller_Scroll' );
}
