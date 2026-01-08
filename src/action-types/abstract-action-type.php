<?php
/**
 * Abstract Action Class
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Abstract_Action_Type' ) ) {
	class Interact_Abstract_Action_Type {

		/**
		 * Action type name
		 *
		 * @var string
		 */
		public $name = '';

		/**
		 * Action type category.
		 *
		 * @var string
		 */
		public $category = '';

		/**
		 * Action type: all, time, percent
		 *
		 * @var string
		 */
		public $type = 'all';

		/**
		 * Action label
		 *
		 * @var string
		 */
		public $label = '';

		/**
		 * Action label, short version used for the editor timeline. If not
		 * available, the label will be used.
		 *
		 * @var string
		 */
		public $short_label = '';

		/**
		 * If given, then the action label will be generated from this
		 * property's value/label instead of the label/short label. This can be
		 * a string format containing the action names e.g. "Hello {name}!"
		 *
		 * @var boolean|string
		 */
		public $dynamic_label = false;

		/**
		 * Action description
		 *
		 * @var string
		 */
		public $description = '';

		/**
		 * Action has preview
		 *
		 * @var boolean
		 */
		public $has_preview = true;

		/**
		 * Action keywords for search
		 *
		 * @var array
		 */
		public $keywords = [];

		/**
		 * Action properties
		 *
		 * @var array
		 */
		public $properties = [];

		/**
		 * Action has a target
		 *
		 * @var boolean
		 */
		public $has_target = true;

		/**
		 * Action targets. This overrides the default target options for the action.
		 *
		 * @var boolean|array
		 */
		public $targets = null;

		/**
		 * Action has target
		 *
		 * @var boolean
		 */
		public $has_starting_state = true;

		/**
		 * Action has duration
		 *
		 * @var boolean
		 */
		public $has_duration = true;

		/**
		 * Action has easing
		 *
		 * @var boolean
		 */
		public $has_easing = true;

		/**
		 * Action's default easing
		 *
		 * @var boolean
		 */
		public $default_easing = '';

		/**
		 * Action has stagger timing
		 *
		 * @var boolean
		 */
		public $has_stagger = true;

		/**
		 * If the action allows dynamic values
		 *
		 * @var boolean
		 */
		public $has_dynamic = true;

		/**
		 * If the action is an animation or not. This will be used for some editor UI adjustments.
		 *
		 * @var boolean
		 */
		public $is_animation = false;

		/**
		 * If the action requires target(s). 
		 * If not required, no warnings will be given if no target is provided.
		 *
		 * @var boolean
		 */
		public $is_required_target = true;

		/**
		 * If the action needs some security checks to ensure the integrity of
		 * the input, then set this to true, the action's values will be hashed
		 * and signed. When the action is used in the frontend, the signature
		 * will be verified, if it fails, the action will not be loaded at all.
		 *
		 * This is useful for actions that have user inputs that are executed or
		 * generated in the frontend, like render shortcode, custom JS or custom
		 * PHP actions.
		 *
		 * @var boolean
		 */
		public $verify_integrity = false;

		/**
		 * Customize the label name for "Applied to" in the editor.
		 *
		 * @var string
		 */
		public $label_applied_to = '';

		/**
		 * Specify the data that the action provides that can be referenced by other actions.
		 * The data should be in the form of "attribute" => "custom name"
		 *
		 * @var array
		 */
		public $provides = [];

		/**
		 * If set to true, then the restApi url and nonces are loaded in the frontend.
		 *
		 * @var boolean
		 */
		public $uses_frontend_rest_api = false;

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
				'shortName' => $this->short_label,
				'dynamicName' => $this->dynamic_label,
				'description' => $this->description,
				'keywords' => $this->keywords,
				'properties' => $this->properties,
				'hasPreview' => $this->has_preview,
				'hasTarget' => $this->has_target,
				'targets' => $this->targets,
				'hasStartingState' => $this->has_starting_state,
				'hasDuration' => $this->has_duration,
				'hasEasing' => $this->has_easing,
				'defaultEasing' => $this->default_easing,
				'hasStagger' => $this->has_stagger,
				'hasDynamic' => $this->has_dynamic,
				'isAnimation' => $this->is_animation,
				'isRequiredTarget' => $this->is_required_target,
				'labelAppliedTo' => $this->label_applied_to,
				'provides' => $this->provides,
			];
		}

		public function get_frontend_inline_script() {
			$path = plugin_dir_path( INTERACT_FILE ) . "dist/frontend/actions/{$this->name}.php";
			$path = apply_filters( "interact/action/inline-path/{$this->name}", $path );

			// Load the rest api url and nonce JS variables in the frontend if needed.
			if ( $this->uses_frontend_rest_api ) {
				Interact_Frontend::enqueue_rest_script_params();
			}

			return include $path;
		}

		// Override to change action properties if needed by the action type.
		public function initilize_action( $action, $animation_data ) {
			// Hide properties that are set to be hidden in the frontend.
			foreach ( $this->properties as $key => $property ) {
				if ( isset( $property['hidden'] ) && $property['hidden'] ) {
					// Remove the property from the action.
					unset( $action['value'][ $key ] );
				}
			}

			return $action;
		}

		/**
		 * Sanitizes the action's value before saving.
		 *
		 * Override this in a child class to implement specific sanitization.
		 *
		 * @param mixed $value The action value to sanitize.
		 * @return mixed The sanitized action value.
		 */
		public function sanitize_data_for_saving( $value ) {
			// By default, no sanitization is applied.
			return $value;
		}

		/**
		 * Remove any `expression(...)` and `javascript:` content from a CSS style string for security.
		 *
		 * @param string $string
		 * @return string
		 */
		public function sanitize_style_value( $string ) {
			if ( ! is_string( $string ) ) {
				return $string;
			}
			// Remove all expression(...) (case-insensitive).
			$string = preg_replace( '/expression\s*\((?:[^\(\)]|(?R))*\)/i', '', $string );

			// Remove all javascript: URIs (case-insensitive).
			$string = preg_replace( '/javascript\s*:/i', '', $string );

			return $string;
		}

		/**
		 * Detect if an HTML tag is considered dangerous (can execute scripts or
		 * otherwise modify page behavior).
		 *
		 * @param string $tag_name
		 * @return bool
		 */
		public function is_dangerous_tag( $tag_name ) {
			if ( empty( $tag_name ) || ! is_string( $tag_name ) ) {
				return false;
			}

			$tag_name = strtolower( trim( $tag_name ) );

			// Tags that can execute scripts or modify page behavior
			$dangerous_tags = [
				'script',
				'iframe',
				'object',
				'embed',
				'applet',
				'meta',
				'link',
				'style',
				'base',
				'form',
			];

			return in_array( $tag_name, $dangerous_tags, true );
		}

		/**
		 * Detect if an HTML attribute is considered dangerous (event handlers,
		 * attributes that can contain JS URIs, form actions, etc.).
		 *
		 * @param string $attribute_name
		 * @return bool
		 */
		public function is_dangerous_attribute( $attribute_name ) {
			if ( empty( $attribute_name ) || ! is_string( $attribute_name ) ) {
				return false;
			}

			$attribute_name = strtolower( trim( $attribute_name ) );

			// Event handler attributes (onclick, onerror, onload, etc.)
			if ( preg_match( '/^on[a-z]+/', $attribute_name ) ) {
				return true;
			}

			// Attributes that can contain JavaScript URIs or code
			$dangerous_attributes = [
				'href',
				'src',
				'action',
				'formaction',
				'form',
				'formmethod',
				'formtarget',
			];

			return in_array( $attribute_name, $dangerous_attributes, true );
		}

		/**
		 * Validate an HTML snippet for dangerous tags, attributes or protocols.
		 * Returns true when safe, or a WP_Error describing the violation.
		 *
		 * @param string $html
		 * @return true|WP_Error
		 */
		public function validate_html_for_saving( $html ) {
			if ( ! is_string( $html ) ) {
				return new WP_Error(
					'invalid_html',
					__( 'HTML must be a string.', 'interactions' )
				);
			}

			// Detect dangerous tags
			if ( preg_match_all( '/<\s*([a-z0-9\-]+)/i', $html, $matches ) ) {
				foreach ( $matches[1] as $tag ) {
					if ( $this->is_dangerous_tag( $tag ) ) {
						return new WP_Error(
							'invalid_tag',
							sprintf( __( 'The HTML tag "%s" is not allowed.', 'interactions' ), esc_html( $tag ) )
						);
					}
				}
			}

			// Detect dangerous attributes
			if ( preg_match_all( '/<[^>]+>/i', $html, $tagMatches ) ) {
				foreach ( $tagMatches[0] as $tagString ) {
					if ( preg_match_all( '/([a-zA-Z0-9:\-]+)\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)/i', $tagString, $attrMatches ) ) {
						foreach ( $attrMatches[1] as $attr ) {
							if ( $this->is_dangerous_attribute( $attr ) ) {
								return new WP_Error(
									'invalid_attribute',
									sprintf( __( 'The HTML attribute "%s" is not allowed.', 'interactions' ), esc_html( $attr ) )
								);
							}
						}
					}
				}
			}

			// Detect disallowed protocols
			if ( preg_match( '/javascript:\s*/i', $html ) || preg_match( '/data:\s*text\//i', $html ) ) {
				return new WP_Error(
					'invalid_protocol',
					__( 'The HTML contains disallowed protocols (javascript: or data:).', 'interactions' )
				);
			}

			return true;
		}
	}
}
