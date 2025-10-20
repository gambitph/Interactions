<?php
/**
 * Contains the interactions library configuration.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interactions_Library' ) ) {
	class Interact_Interactions_Library {

		/**
		 * Loads the editor script.
		 *
		 * @return void
		 */
		function __construct() {
            add_action( 'admin_init', array( $this, 'register_interactions_library_options' ) );
            add_action( 'rest_api_init', array( $this, 'register_route' ) );
		}


        /**
         * Registers the settings for the interactions library.
         * 
         * @return void
         */
		public function register_interactions_library_options() {
			register_setting(
				'interact_interactions_library',
				'interact_interactions_library_favorites',
				array(
					'type' => 'array',
					'description' => __( 'Interactions library favorites list.', 'interactions' ),
					'sanitize_callback' => array( $this, 'sanitize_array_setting' ),
					'show_in_rest' => array(
						'schema' => array(
							'items' => array(
								'type' => 'string',
							)
						)
					),
					'default' => '',
				)
			);
		}

        /**
         * Registers the REST API routes for the interactions library.
         *
         * @return void
         */
        public function register_route() {
			register_rest_route( 'interact/v1', '/get_interactions_library_favorites', array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_interactions_library_favorites' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			) );

            register_rest_route( 'interact/v1', '/update_interactions_library_favorites', array(
				'methods' => 'POST',
				'callback' => array( $this, 'update_interactions_library_favorites' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args' => array(
                    'favorites' => array(
                        'required' => true,
                        'type' => 'array',
                        'items' => array(
                            'type' => 'string',
                        ),
                        'validate_callback' => function ( $value, $request, $param ) {
                            return is_array( $value );
                        },
                    ),
                ),
			) );
        }

        /**
         * Gets the interactions library favorites.
         * @param WP_REST_Request $request The REST request object.
         * 
         * @return WP_REST_Response  
         */
        public function get_interactions_library_favorites( $request ) {
			$favorites = get_option( 'interact_interactions_library_favorites', array() );

			return new WP_REST_Response( $favorites, 200 );
		}

        /**
         * Update the interactions library favorites.
         * @param WP_REST_Request $request The REST request object.
         * 
         * @return WP_REST_Response  
         */
        public function update_interactions_library_favorites( $request ) {
			$favorites = $request->get_param( 'favorites' );

			if ( ! is_array( $favorites ) ) {
                return new WP_REST_Response( array( 'message' => __( 'Invalid favorites data.', 'interactions' ) ), 400 );
            }

            update_option( 'interact_interactions_library_favorites', $favorites );
            return new WP_REST_Response( $favorites, 200 );
		}

        public function sanitize_array_setting( $input ) {
			return ! is_array( $input ) ? array( array() ) : $input;
		}
    }

	new Interact_Interactions_Library();
}
