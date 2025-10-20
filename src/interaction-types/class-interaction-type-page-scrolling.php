<?php
/**
 * Interaction Type: Page Scrolling
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Page_Scrolling' ) ) {
	class Interact_Interaction_Type_Page_Scrolling extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'pageScrolling';
			$this->type = 'page';
			$this->category = 'scroll';

			$this->label = __( 'While page is scrolling', 'interactions' );
			$this->description = __( 'Define actions that happen while the page is scrolling', 'interactions' );
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
			];

			$this->timeline_type = 'percentage'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'pageScrolling', 'Interact_Interaction_Type_Page_Scrolling' );
}
