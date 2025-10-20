<?php
/**
 * Interactions Collection
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Interactions' ) ) {
	class Interact_Interactions {

		/**
		 * Initialize cache clearing hooks
		 */
		public static function init() {
			// Clear cache when interaction posts are modified
			add_action( 'save_post_interact-interaction', array( __CLASS__, 'clear_cache' ) );
			add_action( 'delete_post', array( __CLASS__, 'maybe_clear_cache_on_delete' ) );
			add_action( 'trash_post', array( __CLASS__, 'maybe_clear_cache_on_delete' ) );
			add_action( 'untrash_post', array( __CLASS__, 'maybe_clear_cache_on_delete' ) );
		}

		/**
		 * Clear cache if the deleted/trashed/untrashed post is an interaction
		 */
		public static function maybe_clear_cache_on_delete( $post_id ) {
			$post = get_post( $post_id );
			if ( $post && $post->post_type === 'interact-interaction' ) {
				self::clear_cache();
			}
		}

		/**
		 * Loads all the interactions for the given args.
		 *
		 * @param bool $is_for_frontend Whether or not to load all interactions
		 * or only the ones that should be rendered in the frontend.
		 */
		public static function load( $is_for_frontend = false ) {
			// Create cache key based on context
			$cache_key = 'interact_interactions_' . ( $is_for_frontend ? 'frontend' : 'backend' );
			
			// Try to get from cache first
			$all_interactions = wp_cache_get( $cache_key, 'interactions' );
			
			if ( false === $all_interactions ) {
				if ( $is_for_frontend ) {
					// Load all published interactions.
					$all_interactions = get_posts( array(
						'post_type' => 'interact-interaction',
						'post_status' => 'publish',
						'numberposts' => -1,
						'orderby' => 'date',
						'order' => 'ASC',
					) );

				} else { // For the backend, load all the interactions.
					// Load all the interactions,
					$all_interactions = get_posts( array(
						'post_type' => 'interact-interaction',
						'post_status' => array( 'publish', 'interact-inactive' ),
						'numberposts' => -1,
						'orderby' => 'date',
						'order' => 'ASC',
					) );
				}
				
				// Cache the results for 1 hour
				wp_cache_set( $cache_key, $all_interactions, 'interactions', HOUR_IN_SECONDS );
			}

			$interactions = [];
			foreach ( $all_interactions as $post ) {
				$interaction = new Interact_Interaction( $post );

				// TODO: Validate whether the interaction is valid or not
				// according to the schema, this is important so that our script
				// and editor won't error because of corrupted data / user
				// modified data.

				if ( ! $is_for_frontend ) {
					$interactions[] = $interaction;
				} else if ( $interaction->should_render_in_frontend() ) {
					$interactions[] = $interaction;
				}
			}

			return $interactions;
		}

		/**
		 * Clear the interactions cache.
		 * Should be called when interactions are created, updated, or deleted.
		 */
		public static function clear_cache() {
			wp_cache_delete( 'interact_interactions_frontend', 'interactions' );
			wp_cache_delete( 'interact_interactions_backend', 'interactions' );
		}
	}
}

// Initialize cache clearing hooks
Interact_Interactions::init();
