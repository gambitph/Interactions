<?php
/**
 * Action Type: Background Image
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Background_Image' ) ) {
	class Interact_Action_Type_Background_Image extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'backgroundImage';
			$this->category = 'style';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Background Image', 'interactions' );
			$this->description = __( 'Changes the background image', 'interactions' );

			$this->keywords = [
				'bg',
			];

			$this->properties = [
				'image' => [
					'name' => __( 'Background Image', 'interactions' ),
					'type' => 'image',
					'default' => '',
				],
			];

			$this->has_dynamic = false;
		}
	}

	interact_add_action_type( 'backgroundImage', 'Interact_Action_Type_Background_Image' );
}
