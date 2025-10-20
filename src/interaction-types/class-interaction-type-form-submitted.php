<?php
/**
 * Interaction Type: Form Submitted
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction_Type_Form_Submitted' ) ) {
	class Interact_Interaction_Type_Form_Submitted extends Interact_Abstract_Interaction_Type {
		public function initialize() {
			$this->name = 'formSubmitted';
			$this->type = 'page';
			$this->category = 'pageState';

			$this->label = __( 'Form submitted', 'interactions' );
			$this->description = __( 'Define actions that happen when a form is submitted', 'interactions' );
			$this->timelines = [
				[
					'title' => __( 'Submit Actions', 'interactions' ),
					'slug' => 'submit',
					'description' => '',
				],
			];
			$this->timeline_type = 'time'; // time, percentage.
		}
	}

	interact_add_interaction_type( 'formSubmitted', 'Interact_Interaction_Type_Form_Submitted' );
}
