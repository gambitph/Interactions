<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Stackable_Horizontal_Scroller_Scroll' ) ) {
	class Interact_Action_Type_Stackable_Horizontal_Scroller_Scroll extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'stackableHorizontalScrollerScroll';
			$this->category = 'stackable';
			$this->type = 'time';

			$this->label = __( 'Stackable Horizontal Scroll', 'interactions' );
			$this->description = __( 'Scroll to the given column number', 'interactions' );

			$this->keywords = [];

			$this->properties = [
				'column_number' => [
					'name' => __( 'Column Number', 'interactions' ),
					'type' => 'number',
					'default' => 1,
					'min' => 1,
					'max' => 10,
					'step' => 1,
					'help' => __( 'The column number to change into.', 'interactions' ),
				],
			];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'stackableHorizontalScrollerScroll', 'Interact_Action_Type_Stackable_Horizontal_Scroller_Scroll' );
}
