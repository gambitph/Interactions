<?php
/**
 * Contains the configuration for the editor
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Editor' ) ) {
	class Interact_Editor {

		/**
		 * Loads the editor script.
		 *
		 * @return void
		 */
		function __construct() {
			if ( is_admin() ) {
				add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor' ) );
				add_action( 'enqueue_block_assets', array( $this, 'enqueue_assets' ) );
			}
		}

		/**
		 * Loads the editor script.
		 *
		 * @return void
		 */
		public function enqueue_editor() {
			// Load the required interaciton and action types.
			interact_require_types();

			$build_dir = plugin_dir_path( INTERACT_FILE ) . 'dist/';
			$script_asset = include $build_dir . 'editor.asset.php';

			if ( INTERACT_BUILD === 'premium' ) {
				$script_asset['dependencies'][] = 'interact-editor-premium';
			}

			wp_enqueue_script(
				'interact-editor',
				plugins_url( 'dist/editor.js', INTERACT_FILE ),
				$script_asset['dependencies'],
				$script_asset['version'],
				true
			);
			wp_enqueue_style(
				'interact-editor-utility-classes',
				plugins_url( 'dist/editor-utility-classes.css', INTERACT_FILE ),
				array(),
				INTERACT_VERSION
			);
			wp_enqueue_style(
				'interact-editor',
				plugins_url( 'dist/editor.css', INTERACT_FILE ),
				array(),
				INTERACT_VERSION
			);

			[ $interactions, $interaction_categories ] = $this->get_interaction_types_config();
			[ $actions, $action_categories ] = $this->get_action_types_config();

			global $wp_version;
			$args = apply_filters( 'interact/localize_script', array(
				'interactions' => $interactions,
				'interactionCategories' => $interaction_categories,
				'actions' => $actions,
				'actionCategories' => $action_categories,
				'locationRuleTypes' => Interact_Rest_Location_Rules::get_location_rule_types(),
				'manageInteractionsUrl' => admin_url( 'edit.php?post_type=interact-interaction' ),
				'plan' => '',
				'pluginVersion' => INTERACT_VERSION,
				'wpVersion' => $wp_version,
				'restUrl' => trailingslashit( esc_url_raw( rest_url() ) ), // We need to know how to access the REST API.
				'restNonce' => wp_create_nonce( 'wp_rest' ), // This needs to be 'wp_rest' to use the built-in nonce verification.
				'srcUrl' => untrailingslashit( plugins_url( '/', INTERACT_FILE ) ),
			) );
			wp_localize_script( 'interact-editor', 'interactions', $args );
		}

		public function enqueue_assets() {
			wp_enqueue_style(
				'interact-utility-classes',
				plugins_url( 'dist/utility-classes.css', INTERACT_FILE ),
				array(),
				INTERACT_VERSION
			);

			// This contains nothing for now.
			// wp_enqueue_style(
			// 	'interact-styles',
			// 	plugins_url( 'dist/frontend.css', INTERACT_FILE ),
			// 	array(),
			// 	INTERACT_VERSION
			// );
		}

		/**
		 * Returns the interactions for the editor.
		 *
		 * @return array
		 */
		public function get_interactions() {
			$interactions = Interact_Interactions::load();

			$data = [];
			foreach ( $interactions as $interaction ) {
				$data[] = $interaction->get_data();
			}

			return $data;
		}

		public function get_interaction_types_config() {
			$interactions = [];

			$element_categories = [
				'mouse' => __( 'Mouse', 'interactions' ),
				'html' => __( 'HTML & CSS', 'interactions' ),
				'entrance' => __( 'Entrance', 'interactions' ),
				'keyboard' => __( 'Keyboard', 'interactions' ),
				'misc' => __( 'Miscellaneous', 'interactions' ),
			];

			$page_categories = [
				'page' => __( 'Page', 'interactions' ),
				'scroll' => __( 'Scroll', 'interactions' ),
				'mouse' => __( 'Mouse', 'interactions' ),
				'url' => __( 'URL', 'interactions' ),
				'pageState' => __( 'Page State', 'interactions' ),
				'misc' => __( 'Miscellaneous', 'interactions' ),
			];

			// Gather all the interactions first.

			$element_interactions = [];
			$page_interactions = [];

			$interaction_types = interact_get_interaction_types();
			foreach ( $interaction_types as $interaction_type ) {
				$category = empty( $interaction_type->category ) ? 'misc' : $interaction_type->category;
				$interactions[ $interaction_type->name ] = $interaction_type->get_editor_config();

				if ( $interaction_type->type === 'element' ) {
					if ( ! isset( $element_interactions[ $category ] ) ) {
						$element_interactions[ $category ] = [];
					}
					$element_interactions[ $category ][] = $interaction_type->name;
				} else if ( $interaction_type->type === 'page' ) {
					if ( ! isset( $page_interactions[ $category ] ) ) {
						$page_interactions[ $category ] = [];
					}
					$page_interactions[ $category ][] = $interaction_type->name;
				}
			}

			// Sort the element & page categories.

			$element_interaction_categories = [];
			foreach ( $element_categories as $key => $name ) {
				if ( isset( $element_interactions[ $key ] ) ) {
					$element_interaction_categories[] = [
						'name' => $name,
						'interactions' => $element_interactions[ $key ]
					];
				}
			}

			$page_interaction_categories = [];
			foreach ( $page_categories as $key => $name ) {
				if ( isset( $page_interactions[ $key ] ) ) {
					$page_interaction_categories[] = [
						'name' => $name,
						'interactions' => $page_interactions[ $key ]
					];
				}
			}

			$interaction_categories = [
				'element' => $element_interaction_categories,
				'page' => $page_interaction_categories,
			];

			return [ $interactions, $interaction_categories ];
		}

		public function get_action_types_config() {
			$actions = [];

			// Gather all the actions first.
			$types = [];
			$action_types = interact_get_action_types();
			foreach ( $action_types as $action_type ) {
				$category = empty( $action_type->category ) ? 'misc' : $action_type->category;
				$actions[ $action_type->name ] = $action_type->get_editor_config();

				if ( ! isset( $types[ $category ] ) ) {
					$types[ $category ] = [];
				}
				$types[ $category ][] = $action_type->name;
			}

			// Sort the categories.

			$categories = [
				'display' => __( 'Display', 'interactions' ),
				'animation' => __( 'Animation', 'interactions' ),
				'style' => __( 'Style', 'interactions' ),
				'navigation' => __( 'Navigation', 'interactions' ),
				'event' => __( 'Event', 'interactions' ),
				'svg' => __( 'SVG', 'interactions' ),
				'html' => __( 'HTML', 'interactions' ),
				'data' => __( 'Data Handling', 'interactions' ),
				'web' => __( 'Web Service', 'interactions' ),
				'content' => __( 'Content', 'interactions' ),
				'post' => __( 'Post', 'interactions' ),
				'flow' => __( 'Logic Flow', 'interactions' ),
				'pageState' => __( 'Page State', 'interactions' ),
				'misc' => __( 'Miscellaneous', 'interactions' ),
			];

			$action_categories = [];
			foreach ( $categories as $key => $name ) {
				if ( isset( $types[ $key ] ) ) {
					$action_categories[] = [
						'name' => $name,
						'actions' => $types[ $key ]
					];
				}
			}

			return [ $actions, $action_categories ];
		}
	}

	new Interact_Editor();
}
