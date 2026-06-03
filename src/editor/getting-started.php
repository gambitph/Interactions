<?php
/**
 * Getting Started screen.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Getting_Started_Screen' ) ) {
	class Interact_Getting_Started_Screen {
		function __construct() {
            // Register settings.
            add_action( 'admin_init', array( $this, 'register_settings' ) );
            add_action( 'rest_api_init', array( $this, 'register_settings' ) );
            add_action( 'rest_api_init', array( $this, 'register_route' ) );
            
            if ( is_admin() ) {
                add_filter( 'interact/localize_script', array( $this, 'add_localize_script' ) );
            }
        }
        
        public function register_settings() {
            // This is used to store whether the user has completed a guided tour.
            // If the tour ID is not saved here, the tour will be shown.
            // This is overridable by `?tour=tourId` in the URL.
			register_setting(
				'general',
				'interact_guided_tour_states',
				array(
					'type' => 'array',
					'description' => __( 'An array of strings representing completed block tours.', 'interactions' ),
					'sanitize_callback' => array( $this, 'sanitize_array_setting' ),
                    'show_in_rest' => array(
						'schema' => array(
                            'type' => 'array',
							'items' => array(
								'type' => 'string',
							),
						),
					),
					'default' => array(),
				)
			);
        }

        public function sanitize_array_setting( $input ) {
            if ( ! is_array( $input ) ) {
                return array();
            }
            return array_map( 'sanitize_text_field', $input );
        }

        public function register_route() {
            // Use a custom route because /wp/v2/settings requires manage_options.
            // Editors can complete tours, so they need a capability-appropriate save path.
            register_rest_route( 'interact/v1', '/guided_tour_states', array(
                'methods' => 'POST',
                'callback' => array( $this, 'update_guided_tour_states' ),
                'permission_callback' => function () {
                    return current_user_can( 'edit_posts' );
                },
                'args' => array(
                    'states' => array(
                        'required' => true,
                        'type' => 'array',
                        'items' => array(
                            'type' => 'string',
                        ),
                    ),
                ),
            ) );
        }

        public function update_guided_tour_states( $request ) {
            // Store completion per user so each editor sees each tour only once.
            $states = $this->sanitize_array_setting( $request->get_param( 'states' ) );
            update_user_meta( get_current_user_id(), 'interact_guided_tour_states', $states );

            return rest_ensure_response( $states );
        }

        public function add_localize_script( $args ) {
            $user_states = get_user_meta( get_current_user_id(), 'interact_guided_tour_states', true );
            // Include legacy option-based states and current-user states.
            $args['guidedTourStates'] = array_values( array_unique( array_merge(
                get_option( 'interact_guided_tour_states', array() ),
                is_array( $user_states ) ? $user_states : array()
            ) ) );
            return $args;
        }
	}

	new Interact_Getting_Started_Screen();
}
