<?php
/**
 * Action Type: Focus
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Focus' ) ) {
	class Interact_Action_Type_Focus extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'focus';
			$this->category = 'event';
			$this->type = 'time';

			$this->label = __( 'Focus', 'interactions' );
			$this->description = __( 'Move focus to an element.', 'interactions' );

			$this->keywords = [
				'click',
				'blur',
			];

			$this->targets = [
				[ 'value' => 'trigger' ],
				[ 'value' => 'block' ],
				[ 'value' => 'block-name' ],
				[ 'value' => 'class' ],
				[ 'value' => 'selector' ],
			];

			$this->has_starting_state = false;
			$this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}
	}

	interact_add_action_type( 'focus', 'Interact_Action_Type_Focus' );
}
