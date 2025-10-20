<?php
/**
 * Action Type: Opacity
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Opacity' ) ) {
	class Interact_Action_Type_Opacity extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'opacity';
			$this->category = 'animation';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Opacity', 'interactions' );
			$this->description = __( 'Change the opacity of an element', 'interactions' );

			$this->keywords = [
				'fade',
			];

			$this->properties = [
				'opacity' => [
					'name' => __( 'Opacity', 'interactions' ),
					'type' => 'number',
					'default' => 1,
					'min' => 0,
					'max' => 1,
					'step' => 0.01,
				],
			];

			$this->has_dynamic = false;
		}
	}

	interact_add_action_type( 'opacity', 'Interact_Action_Type_Opacity' );
}
