<?php
/**
 * Action Type: Text Color
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Text_Color' ) ) {
	class Interact_Action_Type_Text_Color extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'textColor';
			$this->category = 'style';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Text Color', 'interactions' );
			$this->description = __( 'Changes the text color', 'interactions' );

			$this->keywords = [
				'text',
				'color',
			];

			$this->properties = [
				'color' => [
					'name' => __( 'Text Color', 'interactions' ),
					'type' => 'color',
					'default' => '#000000',
				],
			];

			$this->has_dynamic = false;
		}
	}

	interact_add_action_type( 'textColor', 'Interact_Action_Type_Text_Color' );
}
