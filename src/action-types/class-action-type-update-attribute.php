<?php
/**
 * Action Type: Toggle HTML attribute
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Interact_Action_Type_Update_Attribute' ) ) {
	class Interact_Action_Type_Update_Attribute extends Interact_Abstract_Action_Type {
		public function initialize() {
			$this->name = 'updateAttribute';
			$this->category = 'html';
			$this->type = 'all';

			$this->label = __( 'Update Attribute', 'interactions' );
			$this->dynamic_label = 'action'; // Use this property as the label.
			$this->description = __( 'Updates an HTML attribute', 'interactions' );

			$this->keywords = [
				'add',
				'remove',
				'data',
			];

			$this->properties = [
				'attribute' => [
					'name' => 'Attribute name',
					'type' => 'text',
					'default' => '',
					'restrictedNotice' => __( 'Some attribute names and values are disallowed unless you are an administrator with unfiltered_html capability for security reasons.', 'interactions' ),
				],
				'value' => [
					'name' => 'Value',
					'type' => 'text',
					'default' => '',
					'help' => __( 'The value to update the attribute to. If toggle is picked below, the attribute will be toggled with this value.', 'interactions' ),
				],
				'action' => [
					'name' => 'Action',
					'type' => 'select',
					'default' => 'update',
					'options' => [
						// Translators: %s is the word 'attribute'.
						[ 'value' => 'update', 'label' => sprintf( __( 'Update %s', 'interactions' ), __( 'attribute', 'interactions' ) ) ],
						// Translators: %s is the word 'attribute'.
						[ 'value' => 'remove', 'label' => sprintf( __( 'Remove %s', 'interactions' ), __( 'attribute', 'interactions' ) ) ],
						// Translators: %s is the word 'attribute'.
						[ 'value' => 'toggle', 'label' => sprintf( __( 'Toggle %s', 'interactions' ), __( 'attribute', 'interactions' ) ) ],
					],
					'help' => __( 'If update is picked, the attribute will be updated to the specifiied value. If remove, the attribute name will just be removed. If toggle, then the attribute with the value will be toggled on and off.', 'interactions' )
				],
			];

			$this->has_starting_state = false;
			$this->has_duration = false;
			$this->has_easing = false;
		}

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
				// 'style', // Can contain CSS with expression() or javascript: URIs
				'form',
				'formmethod',
				'formtarget',
			];
	
			return in_array( $attribute_name, $dangerous_attributes, true );
		}

		public function sanitize_data_for_saving( $value ) {
			// Sanitize action value: ensure $value is an array and attribute/value are strings.
			if ( ! is_array( $value ) ) {
				return new WP_Error(
					'invalid_structure',
					__( 'Value must be an array containing attribute and value keys.', 'interactions' )
				);
			}

			// Sanitize attribute name
			if ( isset( $value['attribute'] ) && is_string( $value['attribute'] ) ) {
				$value['attribute'] = sanitize_key( $value['attribute'] );
			}

			// Sanitize value if present, and convert to string.
			if ( isset( $value['value'] ) ) {
				$value['value'] = $this->sanitize_style_value( $value['value'] );
			}

			// Sanitize action field for select option.
			if ( isset( $value['action'] ) ) {
				$allowed_actions = [ 'update', 'remove', 'toggle' ];
				if ( ! in_array( $value['action'], $allowed_actions, true ) ) {
					$value['action'] = 'update';
				}
			}

			if ( current_user_can( 'unfiltered_html' ) ) {
				return $value;
			}

			if ( ! empty( $value['attribute'] ) && $this->is_dangerous_attribute( $value['attribute'] ) ) {
				// Only allow dangerous attributes if user has unfiltered_html capability
				return new WP_Error(
					'invalid_attribute',
					sprintf(
						// Translators: %s is the attribute name.
						__( 'The attribute "%s" requires administrator privileges with unfiltered_html capability to prevent security vulnerabilities.', 'interactions' ),
						esc_html( $value['attribute'] )
					)
				);
			}

			return $value;
		}
	}

	interact_add_action_type( 'updateAttribute', 'Interact_Action_Type_Update_Attribute' );
}
