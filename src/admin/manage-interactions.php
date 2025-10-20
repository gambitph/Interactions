<?php
/**
 * Admin Manage Interactions
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Admin_Manage_Interactions' ) ) {
	class Interact_Admin_Manage_Interactions {
		public $posts_cache = array();

		function __construct() {
			// Register our custom post type
			add_action( 'init', array( $this, 'register_cpt' ) );

			// Add new columns to the edit screen
			add_filter( 'manage_interact-interaction_posts_columns', array( $this, 'add_columns' ) );

			// Adds content to the columns.
			add_action( 'manage_interact-interaction_posts_custom_column', array( $this, 'custom_columns' ), 10, 2 );

			// Enqueue script for the manage screen
			add_action( 'admin_enqueue_scripts', array( $this, 'add_manage_script' ) );

			add_filter( 'rest_pre_dispatch', array( $this, 'disable_get_interactions' ), 10, 3 );

			// TODO: How do we edit an interaction from here?? what if we can open the interaction directly and can edit it in the sidebar?
			// TODO: Add bulk activate/deactivate
		}

		public function register_cpt() {
			register_post_type( 'interact-interaction', array(
				'public' => false,
				'show_in_rest' => true, // We need this if we want to to edit interactions in the manage screen.
				'exclude_from_search' => true,
				'publicly_queryable' => false,
				'show_ui' => true,
				'show_in_menu' => false,
				'query_var' => false,
				'supports' => array(
					'title',
					'editor',
					'author',
				),
				'capabilities' => array(
					'create_posts' => 'do_not_allow', // Disallow creating new posts
				),
				'map_meta_cap' => true, // Set to `true` to use the custom capabilities
				'labels' => array(
					'name' => __( 'Interactions', 'interactions' ),
					'singular_name' => __( 'Interaction', 'interactions' ),
					'add_new' => __( 'Add New', 'interactions' ),
					'add_new_item' => __( 'Add New Interaction', 'interactions' ),
					'edit_item' => __( 'Edit Interaction', 'interactions' ),
					'new_item' => __( 'New Interaction', 'interactions' ),
					'view_item' => __( 'View Interaction', 'interactions' ),
					'search_items' => __( 'Search Interactions', 'interactions' ),
					'not_found' => __( 'No interactions found', 'interactions' ),
					'not_found_in_trash' => __( 'No interactions found in Trash', 'interactions' ),
					'parent_item_colon' => __( 'Parent Interaction:', 'interactions' ),
					'all_items' => __( 'All Interactions', 'interactions' ),
					'menu_name' => __( 'Interactions', 'interactions' ),
					'name_admin_bar' => __( 'Interaction', 'interactions' ),
				),
			) );

			register_post_status( 'interact-inactive', array(
				'label'                     => _x( 'Inactive', 'post status', 'interactions' ),
				'public'                    => true,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				// Translators: %s is the count of inactive interactions.
				'label_count'               => _n_noop( 'Inactive<span class="count">(%s)</span>', 'Inactive <span class="count">(%s)</span>', 'interactions' ),
			));

		}

		public function add_columns( $columns ) {
			return array(
				'cb' => $columns['cb'],
				'title' => $columns['title'],
				'active' => __( 'Is Active', 'interactions' ),
				'locations' => __( 'Locations', 'interactions' ),
				'key' => __( 'Key', 'interactions' ),
				'author' => $columns['author'],
				'date' => $columns['date']
			);
		}

		public function get_interaction_instance( $post_id ) {
			if ( ! isset( $this->posts_cache[ $post_id ] ) ) {
				$this->posts_cache[ $post_id ] = new Interact_Interaction( get_post( $post_id ) );
			}
			return $this->posts_cache[ $post_id ];

		}

		public function custom_columns( $column_key, $post_id ) {
			if ( $column_key === 'active' ) {
				$interaction = $this->get_interaction_instance( $post_id );
				$activeStatus = $interaction->active ? 'true' : 'false';
				$errorMessage = esc_html__( "Couldn't update the interaction status.", 'interactions' );
				$displayStatus = $interaction->active ? '✔️' : '-';

				echo "<div class=\"interact-interaction-active\"
						data-post-id=\"" . esc_attr( $post_id ) . "\"
						data-value=\"" . esc_attr( $activeStatus ) . "\"
						data-error-message=\"" . esc_attr( $errorMessage ) . "\">
					" . esc_html( $displayStatus ) . "
					</div>";
			} else if ( $column_key === 'key' ) {
				$interaction = $this->get_interaction_instance( $post_id );
				$displayKey = esc_html( $interaction->key );

				echo "<div class=\"interact-interaction-key\"
						data-post-id=\"" . esc_attr( $post_id ) . "\">
					" . esc_html( $displayKey ) . "
					</div>";
			} else if ( $column_key === 'locations' ) {
				$interaction = $this->get_interaction_instance( $post_id );
				$or_locations = $interaction->locations;

				// First level, at least one of the location rules should be met to display.
				foreach ( $or_locations as $or_index => $and_locations ) {
					// Second level, all of these location rules should be met to display.
					foreach ( $and_locations as $and_index => $params ) {
						if ( $and_index > 0 ) {
							// Translators: This is a separator between location rules.
							echo ' ' . esc_html__( 'AND', 'interactions' ) . ' ';
						}
						$location = interact_get_location( $params['param'] );
						echo esc_html( $location->get_display_label( $params['operator'], $params['value'] ) );
					}
					// Print "OR" between each group of locations, except on the last index
					if ( $or_index < count( $or_locations ) - 1 ) {
						// Translators: This is a separator between location rules.
						echo ' ' . esc_html__( 'OR', 'interactions') . '<br>';
					}
				}
			}
		}

		public function add_manage_script() {
			$screen = get_current_screen();

			// Only load the script if we're viewing all interact-interaction posts
			if ( $screen->base === 'edit' && $screen->id === 'edit-interact-interaction' ) {
				wp_enqueue_script( 
					'interact-manage-interactions', 
					plugins_url( 'dist/admin-manage-interactions.js', INTERACT_FILE ),
					array( 'wp-element', 'wp-components', 'wp-api-fetch' ),
					INTERACT_VERSION,
					true
				);
			}
		}

		/**
		 * Disable the REST API for interact-interactions if not logged in.
		 *
		 * @param Object $result
		 * @param Object $server
		 * @param Object $request
		 * @return Object The $result object
		 */
		public function disable_get_interactions( $result, $server, $request ) {
			if ( $request->get_method() === 'GET' && strpos( $request->get_route(), '/wp/v2/interact-interaction' ) !== false ) {
				if ( ! current_user_can( 'edit_posts' ) ) {
					return new WP_Error( '403', esc_html__( 'You do not have permission to perform this action', 'interactions' ), array( 'status' => 403 ) );
				}
			}
			return $result;
		}
	}

	new Interact_Admin_Manage_Interactions();
}
