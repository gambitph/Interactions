<?php
/**
 * Location helper functions.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$interact_location_rules = [];

if ( ! function_exists( 'interact_add_location_rule_type' ) ) {
	function interact_add_location_rule_type( $name, $class ) {
		global $interact_location_rules;
		// $interact_location_rules[ $name ] = new $class();
		$interact_location_rules[ $name ] = $class;
	}
}

if ( ! function_exists( 'interact_get_location' ) ) {
	function interact_get_location( $name ) {
		global $interact_location_rules;
		if ( isset( $interact_location_rules[ $name ] ) ) {
			// The location rules might not be initialized yet.
			if ( is_string( $interact_location_rules[ $name ] ) ) {
				$class = $interact_location_rules[ $name ];
				$interact_location_rules[ $name ] = new $class();
			}
			return $interact_location_rules[ $name ];
		}
		return false;
	}
}

if ( ! function_exists( 'interact_get_locations' ) ) {
	function interact_get_locations() {
		global $interact_location_rules;
		// The location rules might not be initialized yet.
		foreach ( $interact_location_rules as $name => $class ) {
			if ( is_string( $class ) ) {
				$interact_location_rules[ $name ] = new $class();
			}
		}
		return $interact_location_rules;
	}
}
