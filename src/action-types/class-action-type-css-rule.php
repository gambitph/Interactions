<?php
/**
 * Action Type: CSS Rules
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Css_Rule' ) ) {
	class Interact_Action_Type_Css_Rule extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'cssRule';
			$this->category = 'style';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'CSS Rule', 'interactions' );
			$this->description = __( 'Change a CSS style rule', 'interactions' );

			$this->keywords = [
				'rule',
				'update',
			];

			$this->properties = [
				'property' => [
					'name' => __( 'CSS Property', 'interactions' ),
					'type' => 'text',
					'default' => '',
					'help' => __( 'CSS Custom Properties are supported. For example: border-radius, --my-property.', 'interactions' ),
					'hasDynamic' => false,
				],
				'value' => [
					'name' => __( 'Value', 'interactions' ),
					'type' => 'text',
					'default' => '',
					'help' => __( 'CSS Custom Properties and functions like calc() are supported. For example: 10px, 50%, #000000, etc. When using calc, make sure to add spaces between operators.', 'interactions' ),
				],
			];
		}
	}

	interact_add_action_type( 'cssRule', 'Interact_Action_Type_Css_Rule' );
}
