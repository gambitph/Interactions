<?php
/**
 * Post Location Object
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Location_Page_Template' ) ) {
	class Interact_Location_Page_Template extends Interact_Location {

		public function initialize() {
			$this->name = 'page_template';
			$this->label = __( 'Page template', 'interactions' );
			$this->category = 'page';
		}

		/**
		 * Gets the values that will be displayed in the location picker.
		 *
		 * @return array
		 */
		public function get_values() {
			$options = [];

			// Get all post templates
			$post_templates = wp_get_theme()->get_post_templates();
			foreach ( $post_templates as $post_type => $templates ) {
				if ( $post_type !== 'page' ) {
					continue;
				}

				if ( count( $templates ) ) {
					$template_options = [];
					foreach ( $templates as $value => $label ) {
						$template_options[] = [
							'value' => $value,
							'label' => $label,
						];
					}

					$options[] = [
						'label' => ucfirst( $post_type ),
						'options' => $template_options,
					];
				}
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
			return $this->compare_to_rule( $screen->post_template, $operator, $value );
		}
	}

	interact_add_location_rule_type( 'page_template', 'Interact_Location_Page_Template' );
}
