<?php
/**
 * Action Object
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action' ) ) {
	class Interact_Action {
		private $action_data = [];

		/**
		 * Constructor
		 *
		 * @param Array $action_data Raw post data array.
		 */
		function __construct( $action_data ) {
			$this->action_data = $action_data;
		}

		public function get_value( $name ) {
			return $this->action_data['value'][ $name ];
		}

		public static function find_action( $action_key, $interaction_key ) {
			// Look for the action.
			$interactions = get_posts( [
				'name' => $interaction_key,
				'post_type' => 'interact-interaction',
				'post_status' => 'publish',
			] );

			if ( count( $interactions ) ) {
				$interaction = new Interact_Interaction( $interactions[0] );
				return $interaction->get_action( $action_key );
			}

			return null;
		}
	}
}
