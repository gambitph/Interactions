<?php
/**
 * Post Location Object
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Location_Page_Parent' ) ) {
	class Interact_Location_Page_Parent extends Interact_Location_Page {

		public function initialize() {
			$this->name = 'page_parent';
			$this->label = __( 'Page parent', 'interactions' );
			$this->category = 'page';
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
			return $this->compare_to_rule( $screen->page_parent, $operator, $value );
		}
	}

	interact_add_location_rule_type( 'page_parent', 'Interact_Location_Page_Parent' );
}
