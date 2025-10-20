<?php
/**
 * Frontend Screen
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Frontend_Screen' ) ) {
	class Interact_Frontend_Screen {
		private static $instance = null;

		private $cached_params = array();

		public static function get_instance() {
			if ( self::$instance === null ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		public function __get( $name ) {
			if ( isset( $this->cached_params[ $name ] ) ) {
				return $this->cached_params[ $name ];
			}

			if ( $name === 'post_id' ) {
				$value = get_the_id();
				$this->cached_params['post_id'] = $value;
				return $value;
			}
			if ( $name === 'post_type' ) {
				$value = get_post_type();
				$this->cached_params['post_type'] = $value;
				return $value;
			}
			if ( $name === 'post_format' ) {
				$value = get_post_format() ? get_post_format() : 'standard';
				$this->cached_params['post_format'] = $value;
				return $value;
			}
			if ( $name === 'post_status' ) {
				$value = get_post_status();
				$this->cached_params['post_status'] = $value;
				return $value;
			}
			if ( $name === 'post_archive' ) {
				$value = is_post_type_archive();
				$this->cached_params['post_archive'] = $value;
				return $value;
			}
			if ( $name === 'post_template' ) {
				$value = get_page_template_slug();
				$this->cached_params['post_template'] = $value;
				return $value;
			}
			if ( $name === 'post_categories' ) {
				// Get only the slug.
				$value = array_map( function( $category ) {
					return $category->slug;
				}, get_the_category() );
				$this->cached_params['post_categories'] = $value;
				return $value;
			}
			if ( $name === 'wp_template' ) {
				// WP adds the current block template here.
				global $_wp_current_template_id;
				$value = $_wp_current_template_id;
				$this->cached_params['wp_template'] = $value;
				return $value;
			}
			// TODO:
			// Get only the slugs.
			// get_the_terms
			if ( $name === 'post_taxonomies' ) {
				$value = get_the_taxonomies();
				$this->cached_params['post_taxonomies'] = $value;
				return $value;
			}
			if ( $name === 'page_parent' ) {
				$value = wp_get_post_parent_id( get_the_ID() );
				$this->cached_params['page_parent'] = $value;
				return $value;
			}
			if ( $name === 'is_home' ) {
				$value = is_home();
				$this->cached_params['is_home'] = $value;
				return $value;
			}
			if ( $name === 'is_front_page' ) {
				$value = is_front_page();
				$this->cached_params['is_front_page'] = $value;
				return $value;
			}
			if ( $name === 'is_single' ) {
				$value = is_single();
				$this->cached_params['is_single'] = $value;
				return $value;
			}
			if ( $name === 'is_page' ) {
				$value = is_page();
				$this->cached_params['is_page'] = $value;
				return $value;
			}
			if ( $name === 'is_archive' ) {
				$value = is_archive();
				$this->cached_params['is_archive'] = $value;
				return $value;
			}
			if ( $name === 'is_tax' ) {
				$value = is_tax();
				$this->cached_params['is_tax'] = $value;
				return $value;
			}
			if ( $name === 'is_category' ) {
				$value = is_category();
				$this->cached_params['is_category'] = $value;
				return $value;
			}
			if ( $name === 'is_tag' ) {
				$value = is_tag();
				$this->cached_params['is_tag'] = $value;
				return $value;
			}
		}
	}
}
