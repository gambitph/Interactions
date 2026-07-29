<?php
/**
 * Interaction Type: Stackable Accordion Toggle
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Stackable_Tabs_Change' ) ) {
	class Interact_Interaction_Type_Stackable_Tabs_Change extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'stackableTabsChange';
			$this->type = 'element';
			$this->category = 'stackable';

			$this->label = __( 'Stackable Tabs Change', 'interactions' );
			$this->description = __( 'Define actions that happen when the tabs block changes its current tab', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Tabs Change Actions', 'interactions' ),
					'slug' => 'tabs',
					'description' => '',
				],
			];
			$this->timeline_type = 'time';

			$this->options = [
				[
					'label' => __( 'Tab', 'interactions' ),
					'name' => 'tab',
					'type' => 'number',
					'default' => '',
					'min' => 1,
					'max' => 10,
					'step' => 1,
				'help' => __( 'When the tabs block changes into this tab, trigger the actions. Leave this blank to trigger for every tab change.', 'interactions' ),
				],
			];
		}
	}

	interact_add_interaction_type( 'stackableTabsChange', 'Interact_Interaction_Type_Stackable_Tabs_Change' );
}
