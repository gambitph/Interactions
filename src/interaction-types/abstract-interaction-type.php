<?php
/**
 * Abstract Interaction Class
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Abstract_Interaction_Type' ) ) {
	class Interact_Abstract_Interaction_Type {

		/**
		 * Interaction type name
		 *
		 * @var string
		 */
		public $name = '';

		/**
		 * Interaction type category.
		 *
		 * @var string
		 */
		public $category = '';

		/**
		 * Interaction type
		 *
		 * @var string
		 */
		public $type = 'element';

		/**
		 * Interaction label
		 *
		 * @var string
		 */
		public $label = '';

		/**
		 * Interaction description
		 *
		 * @var string
		 */
		public $description = '';

		/**
		 * Interaction timelines
		 *
		 * @var array
		 */
		public $timelines = [];

		/**
		 * Interaction timeline type
		 *
		 * @var string
		 */
		public $timeline_type = 'time';

		/**
		 * Interaction options
		 *
		 * @var array
		 */
		public $options = [];

		/**
		 * Constructor
		 */
		public function __construct() {
			$this->initialize();
		}

		/**
		 * Initialize properties
		 *
		 * @return void
		 */
		public function initialize() {
			// Override and initialize properties here.
		}

		public function get_editor_config() {
			return [
				'type' => $this->type,
				'name' => $this->label,
				'description' => $this->description,
				'timelines' => $this->timelines,
				'timelineType' => $this->timeline_type,
				'options' => $this->options,
			];
		}

		/**
		 * Provide other configuration that the frontend may need.
		 *
		 * @return string Javascript configuration
		 */
		public function get_frontend_config_script() {
// return <<<JS
// InteractRunner.addInteractionConfig( {
// 	{$this->name}: {
// 		type: '{$this->type}',
// 		timelineType: '{$this->timeline_type}',
// 	},
// } );
// JS;
			// This is the minified version of the above code.
			return "InteractRunner.addInteractionConfig({" . esc_attr( $this->name ) . ":{type:'" . esc_attr( $this->type ) . "',timelineType:'" . esc_attr( $this->timeline_type ) . "'}});";
		}

		public function get_frontend_inline_script() {
			$path = plugin_dir_path( INTERACT_FILE ) . "dist/frontend/interactions/{$this->name}.php";
			$path = apply_filters( "interact/interaction/inline-path/{$this->name}", $path );

			return ( include $path ) . $this->get_frontend_config_script();
		}
	}
}
