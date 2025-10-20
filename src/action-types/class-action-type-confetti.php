<?php
/**
 * Action Type: Confetti
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Confetti' ) ) {
	class Interact_Action_Type_Confetti extends Interact_Abstract_Action_Type {
		public function __construct() {
			parent::__construct();

			add_action( "interact/action/enqueue/confetti", array( $this, 'enqueue_frontend_script' ) );
		}

		public function initialize() {
			$this->name = 'confetti';
			$this->category = 'misc';
			$this->type = 'all';

			$this->label = __( 'Throw Confetti', 'interactions' );
			$this->short_label = __( 'Confetti', 'interactions' );
			$this->description = __( 'Celebrate with some confetti!', 'interactions' );

			$this->keywords = [];

			$this->properties = [];

			$this->targets = [
				[ 'value' => 'trigger' ],
				[ 'value' => 'block' ],
				[ 'value' => 'block-name' ],
				[ 'value' => 'class' ],
				[ 'value' => 'selector' ],
				[ 'value' => 'window' ],
			];

			$this->has_starting_state = false;
			// $this->has_preview = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}

		public function enqueue_frontend_script() {
			wp_enqueue_script( 
				'interact-frontend-confetti', 
				plugins_url( 'dist/frontend-confetti.js', INTERACT_FILE ), 
				array( 'interact-frontend' ), 
				INTERACT_VERSION,
				true
			);
		}
	}

	interact_add_action_type( 'confetti', 'Interact_Action_Type_Confetti' );
}
