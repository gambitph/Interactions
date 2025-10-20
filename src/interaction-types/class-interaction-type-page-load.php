<?php
/**
 * Interaction Type: Page Load
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Page_Load' ) ) {
	class Interact_Interaction_Type_Page_Load extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'pageLoad';
			$this->type = 'page';
			$this->category = 'page';

			$this->label = __( 'Page load', 'interactions' );
			$this->description = __( 'Define actions that happen when this page loads', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Page Load Actions', 'interactions' ),
					'slug' => 'load',
					'description' => '',
					'onceOnly' => false,
					'alwaysReset' => false,
				],
			];
			$this->timeline_type = 'time'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'pageLoad', 'Interact_Interaction_Type_Page_Load' );
}
