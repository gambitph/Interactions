<?php
/**
 * Main Interaction Object
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interaction' ) ) {
	class Interact_Interaction {
		private $post = [];
		private $interaction_data = [];

		/**
		 * Gets the post id from a given interaction key
		 *
		 * @param string $key
		 * @return int
		 */
		public static function get_post_id_from_key( $key ) {
			$posts = get_posts( [
				'post_type' => 'interact-interaction',
				'name' => $key,
				'numberposts' => 1,
				'post_status' => 'any',
			] );
			if ( count( $posts ) ) {
				return $posts[0]->ID;
			}
			return 0;
		}

		/**
		 * Constructor
		 *
		 * @param WP_Post $post Raw post data where the interaction was saved.
		 */
		function __construct( $post ) {
			$this->post = $post;

			$this->interaction_data = @unserialize( trim( $post->post_content ) ); // @ is needed here so we don't display warnings.
			if ( empty( $this->interaction_data ) ) { // If unserialize failed.
				$this->interaction_data = [];
			}

			// TODO: ensure that all the fields are present and follow the schema.
			$this->interaction_data['key'] = $this->post->post_name;
			$this->interaction_data['title'] = $this->post->post_title;
			$this->interaction_data['modified'] = strtotime( $this->post->post_modified );
			$this->interaction_data['active'] = $this->post->post_status === 'publish';
		}

		/**
		 * Updates or inserts the interaction as a post in the DB
		 *
		 * @param array $interaction_data
		 * @return int|WP_Error
		 */
		public static function update( $interaction_data ) {
			$post_arr = [
				'ID' => self::get_post_id_from_key( $interaction_data['key'] ),
				'post_type' => 'interact-interaction',
				'post_name' => $interaction_data['key'],
				'post_title' => $interaction_data['title'],
				// TODO: emojis do not work somehow.
				'post_content' => wp_slash( maybe_serialize( self::secure_interaction_data( $interaction_data ) ) ),
				'post_status' => $interaction_data['active'] ? 'publish' : 'interact-inactive',
			];
			$result = $post_arr['ID'] === 0 ? wp_insert_post( $post_arr ) : wp_update_post( $post_arr );
			
			// Clear cache after successful update
			if ( ! is_wp_error( $result ) ) {
				Interact_Interactions::clear_cache();
			}
			
			return $result;
		}

		/**
		 * Runs through all interaction data, and if the action-type has a
		 * $verify_integrity set to true, it will hash and sign the action's
		 * values.
		 *
		 * @param array $interaction_data
		 * @return array
		 */
		public static function secure_interaction_data( $interaction_data ) {
			foreach ( $interaction_data['timelines'] as $timeline_index => $timeline ) {
				foreach ( $timeline['actions'] as $action_index => $action ) {
					$action_type = $action['type'];

					$action_config = interact_get_action_type( $action_type );
					$action_value = $action['value'];

					if ( $action_config->verify_integrity ) {
						$signature = hash_hmac( 'sha256', wp_json_encode( $action_value ), interact_salt() );

						// Add the signature to the data.
						$interaction_data['timelines'][ $timeline_index ]['actions'][ $action_index ]['signature'] = $signature;
					}
				}
			}

			return $interaction_data;
		}

		/**
		 * Validates whether an interaction array is valid
		 *
		 * @param array $interaction_data
		 * @return boolean|WP_Error
		 */
		public static function validate_interaction_data( $interaction_data ) {
			// TODO: use rest_validate_value_from_schema & rest_sanitize_value_from_schema
			return true;
		}

		/**
		 * Deletes the interaction by trashing the post in the DB
		 *
		 * @return void
		 */
		public static function trash( $interaction_key ) {
			$result = wp_trash_post( self::get_post_id_from_key( $interaction_key ) );
			
			// Clear cache after successful deletion
			if ( ! is_wp_error( $result ) ) {
				Interact_Interactions::clear_cache();
			}
			
			return $result;
		}

		/**
		 * Sets interaction data
		 *
		 * @param Object $interaction_data
		 * @return void
		 */
		public function set_data( $interaction_data ) {
			$this->interaction_data = $interaction_data;
			$this->post->post_content = wp_json_encode( $interaction_data );
			$this->post->post_name = $interaction_data['key'];
			$this->post->post_title = $interaction_data['title'];
		}

		/**
		 * Gets the interaction data
		 *
		 * @return Object
		 */
		public function get_data() {
			return $this->interaction_data;
		}

		public function __get( $prop ) {
			return $this->interaction_data[ $prop ];
		}

		/**
		 * Use the location data set for the interaction to decide whether this
		 * interaction should be loaded in the frontend.
		 *
		 * @return boolean True whether the interaction should be loaded in the
		 * frontend.
		 */
		public function should_render_in_frontend() {
			// If location is not available, then don't do anything, maybe corrupted data.
			if ( empty( $this->interaction_data['locations'] ) ) {
				return false;
			}

			$or_locations = $this->interaction_data['locations'];
			$screen = Interact_Frontend_Screen::get_instance();

			// First level, at least one of the location rules should be met to display.
			foreach ( $or_locations as $and_locations ) {
				$all_matched = true;
				// Second level, all of these location rules should be met to display.
				foreach ( $and_locations as $params ) {
					$location = interact_get_location( $params['param'] );
					if ( ! $location || ! $location->is_match( $screen, $params['operator'], $params['value'] ) ) {
						$all_matched = false;
						break;
					}
				}
				if ( $all_matched ) {
					return true;
					break;
				}
			}

			return false;
		}

		/**
		 * Goes through the interaction's timelines and runs a security check
		 * for all actions that have $verify_integrity set to true.
		 *
		 * If the action is not secure, it will not be included in the timeline.
		 *
		 * @return void
		 */
		public function get_secure_timeline_actions() {
			$timelines = $this->interaction_data['timelines'];

			foreach ( $timelines as $timeline_index => $timeline ) {
				foreach ( $timeline['actions'] as $action_index => $action ) {
					$action_type = $action['type'];

					$action_config = interact_get_action_type( $action_type );

					if ( ! empty( $action_config ) && $action_config->verify_integrity ) {
						$action_value = $action['value'];
						$signature = hash_hmac( 'sha256', wp_json_encode( $action_value ), interact_salt() );

						// If the signature is not valid, remove the action from the timeline.
						if ( ! hash_equals( $signature, $action['signature'] ) ) {
							unset( $timelines[ $timeline_index ]['actions'][ $action_index ] );
						}

						// Remove the signature from the data.
						unset( $timelines[ $timeline_index ]['actions'][ $action_index ]['signature'] );
					}
				}

				// Fix the action indices
				$timelines[ $timeline_index ]['actions'] = array_values( $timelines[ $timeline_index ]['actions'] );
			}

			return $timelines;
		}

		/**
		 * Generates the animation data for the interaction. The data generated
		 * should be library-agnostic, just the necessary animation data that we
		 * need, the frontend animation script will be in charge of using this
		 * data to generate the actual animation.
		 *
		 * @return Object The animation data
		 */
		public function generate_animation_data() {
			// return only the necessary interaction data.
			return [
				'key' => $this->interaction_data['key'],
				'title' => $this->interaction_data['title'],
				'type' => $this->interaction_data['type'],
				'target' => $this->interaction_data['target'],
				'timelines' => $this->get_secure_timeline_actions(),
				'options' => array_key_exists( 'options', $this->interaction_data ) ? $this->interaction_data['options'] : [],
			];
		}

		/**
		 * Looks for the action with the given key in any of the interaction's
		 * timelines
		 *
		 * @param string $action_key
		 * @return
		 */
		public function get_action( $action_key ) {
			$timelines = $this->get_secure_timeline_actions();
			foreach ( $timelines as $timeline ) {
				foreach ( $timeline['actions'] as $action ) {
					if ( $action['key'] === $action_key ) {
						return new Interact_Action( $action );
					}
				}
			}
			return null;
		}
	}
}
