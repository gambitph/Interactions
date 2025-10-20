<?php
/**
 * Action Type: Redirect to URL
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Redirect_To_Url' ) ) {
	class Interact_Action_Type_Redirect_To_Url extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'redirectToUrl';
			$this->category = 'navigation';
			$this->type = 'all';

			$this->label = __( 'Redirect', 'interactions' );
			$this->description = __( 'Redirect to a URL', 'interactions' );

			$this->keywords = [
				'scrolltop',
			];

			$this->properties = [
				'url' => [
					'name' => __( 'URL', 'interactions' ),
					'type' => 'text',
					'placeholder' => 'https://',
					'help' => __( 'The URL to redirect to.', 'interactions' ),
				],
			];

			$this->has_target = false;
			$this->has_starting_state = false;
			$this->has_duration = false;
			$this->has_easing = false;
			$this->has_preview = false;
		}
	}

	interact_add_action_type( 'redirectToUrl', 'Interact_Action_Type_Redirect_To_Url' );
}
