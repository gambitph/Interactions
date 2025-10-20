<?php
/**
 * Action Type: Display
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Display' ) ) {
	class Interact_Action_Type_Display extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'display';
			$this->category = 'display';
			$this->type = 'all';
			$this->is_animation = true;

			$this->label = __( 'Display', 'interactions' );
 			$this->description = __( 'Change the CSS rule: display', 'interactions' );

			$this->keywords = [
				'none',
				'hide',
				'show',
				'block',
				'flex',
				'grid',
			];

			$this->properties = [
				'display' => [
					'name' => __( 'Display', 'interactions' ),
					'type' => 'select',
					'options' => [
						[ 'label' => __( 'Block', 'interactions' ), 'value' => 'block' ],
						[ 'label' => __( 'None', 'interactions' ), 'value' => 'none' ],
						[ 'label' => __( 'Inline', 'interactions' ), 'value' => 'inline' ],
						[ 'label' => __( 'Inline-block', 'interactions' ), 'value' => 'inline-block' ],
						[ 'label' => __( 'Flex', 'interactions' ), 'value' => 'flex' ],
						[ 'label' => __( 'Inline-flex', 'interactions' ), 'value' => 'inline-flex' ],
						[ 'label' => __( 'Grid', 'interactions' ), 'value' => 'grid' ],
						[ 'label' => __( 'Inline-grid', 'interactions' ), 'value' => 'inline-grid' ],
						[ 'label' => __( 'Initial', 'interactions' ), 'value' => 'initial' ],
						[ 'label' => __( 'Inherit', 'interactions' ), 'value' => 'inherit' ],
						[ 'label' => __( 'Revert', 'interactions' ), 'value' => 'revert' ],
						[ 'label' => __( 'Unset', 'interactions' ), 'value' => 'unset' ],
					],
					'default' => 'block',
				],
			];

			// $this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'display', 'Interact_Action_Type_Display' );
}
