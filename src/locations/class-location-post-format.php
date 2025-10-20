<?php
/**
 * Post Location Object
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Location_Post_Format' ) ) {
	class Interact_Location_Post_Format extends Interact_Location {

		public function initialize() {
			$this->name = 'post_format';
			$this->label = __( 'Post format', 'interactions' );
			$this->category = 'post';
		}

		/**
		 * Gets the values that will be displayed in the location picker.
		 *
		 * @return array
		 */
		public function get_values() {
			$options = [];

			// Get all available post formats
			$post_formats = get_theme_support( 'post-formats' );
			$has_standard = false;
			if ( ! empty( $post_formats ) && is_array( $post_formats ) && isset( $post_formats[0] ) ) {
				foreach ( $post_formats[0] as $post_format ) {
					$options[] = [
						'value' => $post_format,
						'label' => $post_format,
					];
					if ( $post_format === 'standard' ) {
						$has_standard = true;
					}
				}
			}
			// Add the Standard post format if it's not in there yet.
			if ( ! $has_standard ) {
				array_unshift( $options, [
					'value' => 'standard',
					'label' => __( 'Standard', 'interactions' ),
				] );
			}

			return $options;
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
			return $this->compare_to_rule( $screen->post_format, $operator, $value );
		}
	}

	interact_add_location_rule_type( 'post_format', 'Interact_Location_Post_Format' );
}
