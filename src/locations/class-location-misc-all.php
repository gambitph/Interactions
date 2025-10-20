<?php
/**
 * Post Location Object
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Location_Misc_All' ) ) {
	class Interact_Location_Misc_All extends Interact_Location {

		public function initialize() {
			$this->name = 'all';
			$this->label = __( 'Entire website', 'interactions' );
			$this->category = 'misc';
			$this->editor_options = [
				'hasValueControl' => false,
			];
		}

		/**
		 * Gets the values that will be displayed in the location picker.
		 *
		 * @return array
		 */
		public function get_values() {
			return [];
		}

		/**
		 * Matches wether the saved location rule applies to the current
		 * frontend page.
		 *
		 * @param Interact_Frontend_Screen $screen Object containing the properties of the current
		 * page. See interact_get_frontend_screen() for more info.
		 * @param string $operator == or !==
		 * @param mixed $value The value to check against
		 * @return boolean True if the rule matches, false otherwise.
		 */
		public function is_match( $screen, $operator, $value ) {
			return true;
		}

		/**
		 * Get the display label for the location rule.
		 *
		 * @param string $operator
		 * @param string $value
		 * @return string
		 */
		public function get_display_label( $operator, $value ) {
			return $this->label;
		}
	}

	interact_add_location_rule_type( 'all', 'Interact_Location_Misc_All' );
}
