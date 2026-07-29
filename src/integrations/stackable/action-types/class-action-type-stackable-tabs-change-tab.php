<?php
// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Stackable_Tabs_Change_Tab' ) ) {
	class Interact_Action_Type_Stackable_Tabs_Change_Tab extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'stackableTabsChangeTab';
			$this->category = 'stackable';
			$this->type = 'time';

			$this->label = __( 'Stackable Change Tab', 'interactions' );
			$this->description = __( 'Change the current tab of the Stackable Tabs', 'interactions' );

			$this->keywords = [];

			$this->properties = [
				'tab' => [
					'name' => __( 'Tab', 'interactions' ),
					'type' => 'number',
					'default' => 1,
					'min' => 1,
					'max' => 10,
					'step' => 1,
					'help' => __( 'The tab number to change into.', 'interactions' ),
				],
			];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'stackableTabsChangeTab', 'Interact_Action_Type_Stackable_Tabs_Change_Tab' );
}
