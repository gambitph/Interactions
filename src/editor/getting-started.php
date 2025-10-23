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

        public function add_localize_script( $args ) {
            $args['guidedTourStates'] = get_option( 'interact_guided_tour_states', array() );
            return $args;
        }
	}

	new Interact_Getting_Started_Screen();
}
