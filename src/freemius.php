<?php
/**
 * Freemius functions.
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'FSLite\Api\PublicApi' ) ) {
	require_once( plugin_dir_path( __FILE__ ) . 'freemius/src/FSLite/Api/PublicApi.php' );
	require_once( plugin_dir_path( __FILE__ ) . 'freemius/src/FSLite/Api/AuthenticatedApi.php' );
	require_once( plugin_dir_path( __FILE__ ) . 'freemius/src/FSLite/Data/License.php' );
}

use FSLite\Api\PublicApi;
use FSLite\Api\AuthenticatedApi;
use FSLite\Data\License;

if ( ! class_exists( 'Interact_Freemius' ) ) {
	class Interact_Freemius {

		/**
		 * API base URL constant
		 * @var string
		 */
		const API_BASE_URL = 'https://api.freemius.com';

		/**
		 * The current instance of the class.
		 * @var Interact_Freemius
		 */
		private static $instance = null;

		/**
		 * Option name
		 * @var string
		 */
		private $option_name = 'interact_activation_data';

		/**
		 * Plugin ID
		 * @var string
		 */
		public $plugin_id;

		/**
		 * Activated status constant
		 * @var string
		 */
		const STATUS_ACTIVATED = 'activated';

		/**
		 * Deactivated status constant
		 * @var string
		 */
		const STATUS_DEACTIVATED = 'deactivated';

		/**
		 * Plugin slug
		 * @var string
		 */
		private $slug = '';

		/**
		 * Plugin main file
		 * @var string
		 */
		public $plugin_main_file = '';

		public static function get_instance( $args = [] ) {
			if ( null === self::$instance ) {
				self::$instance = new self( $args );
			}
			return self::$instance;
		}

		/**
		 * Interact_Freemius constructor.
		 *
		 * @param $args
		 */
		function __construct( $args = [] ) {
			$this->plugin_id = $args['plugin_id'];
			$this->option_name = $args['option_name'];
			$this->slug = $args['slug'];
			$this->plugin_main_file = $args['plugin_main_file'];

			// Plugin updates.
			add_filter( 'plugins_api', array( $this, 'plugins_api_filter' ), 10, 3 );
			add_filter( 'site_transient_update_plugins', array( $this, 'update_plugin' ) );
			add_action( 'upgrader_process_complete', array( $this, 'purge_plugin' ), 10, 2 );
		}

		/**
		 * Activates a license key. This also saves a unique ID based on the
		 * site URL to the database - this will be used to cross check during
		 * deactivation on whether or not to continue deactivating. We do not
		 * store the site URL directly.
		 *
		 * @param string $license_key
		 * @return void
		 */
		public function activate_license_key( $license_key ) {
			if ( empty( $license_key ) ) {
				return false;
			}

			$plugin_data = get_plugin_data( $this->plugin_main_file );
			$args = [
				// Required data.
				'license_key' => $license_key,
				'uid' => $this->get_current_site_uid(),
				// Optional data.
				'url' => get_site_url(),
				'version' => $plugin_data['Version'],
			];

			// Add any existing install ID if it exists so we don't add a new entry.
			$activation_data = get_option( $this->option_name );
			if ( ! empty( $activation_data['install_id'] ) ) {
				$args['install_id'] = $activation_data['install_id'];
			} else {
				$activation_data = [];
			}

			$api = new PublicApi( self::API_BASE_URL );
            $response = $api->post( "v1/plugins/$this->plugin_id/activate.json", $args );
			$created_install = $api->validateResponse( $response );

			if ( is_wp_error( $created_install ) ) {
				return $created_install;
			}

			// Save the activation data.
            if ( isset( $created_install['install_id'] ) ) {
				$activation_data['activation_params'] = $args;
				$activation_data['install_id'] = $created_install['install_id'];
				$activation_data['date'] = ( new DateTime() )->format( 'Y-m-d H:i:s' );
				$activation_data['status'] = self::STATUS_ACTIVATED;
				$activation_data['install_data'] = $created_install;
				update_option( $this->option_name, $activation_data, 'no' );
				return true;
			}

			return false;
		}

		/**
		 * Do not use for now since this is "deactivate and activate" and not
		 * "sync". Side effect might be that a user with an expired license
		 * might not be able to re-active their license key after deactivation.
		 *
		 * @return boolean
		 */
		public function sync_license() {
			if ( $this->is_activated() ) {
				$activation_data = get_option( $this->option_name );
				if ( empty( $activation_data['activation_params'] ) || empty( $activation_data['activation_params']['license_key'] ) ) {
					return false;
				}
				$license_key = $activation_data['activation_params']['license_key'];

				$this->deactivate();

				return $this->activate_license_key( $license_key );
			}
			return false;
		}

		public function deactivate() {
			$activation_data = get_option( $this->option_name );

			if ( ! $this->can_deactivate( $activation_data ) ) {
				return false;
			}

			$args = [
				// Required data.
				'uid' => $activation_data['activation_params']['uid'],
				'install_id' => $activation_data['install_id'],
				'license_key' => $activation_data['activation_params']['license_key'],
				'url' => get_site_url(),
			];

			$api = new PublicApi( self::API_BASE_URL );
			$response = $api->post( "v1/plugins/$this->plugin_id/deactivate.json", $args );
			$deleted_install = $api->validateResponse( $response );

			if ( is_wp_error( $deleted_install ) ) {
				return $deleted_install;
			}

            if ( isset( $deleted_install['id'] ) ) {
				$activation_data['status'] = self::STATUS_DEACTIVATED;
				// Remove the license key so it's not visible in the database.
				if ( ! empty( $activation_data['activation_params']['license_key'] ) ) {
					$activation_data['activation_params']['license_key'] = '';
				}
				update_option( $this->option_name, $activation_data, 'no' );
				return true;
			}

			return false;
		}

		private function can_deactivate( $activation_data ) {
			if ( empty( $activation_data ) ) {
				return false;
			}
			// Check for uid, install id & license key
			if ( empty( $activation_data['install_id'] ) || empty( $activation_data['activation_params']['uid'] ) || empty( $activation_data['activation_params']['license_key'] ) ) {
				return false;
			}
			// Current site id should match
			if ( $activation_data['activation_params']['uid'] !== $this->get_current_site_uid() ) {
				return false;
			}

			return true;
		}

		public function is_activated() {
			$activation_data = get_option( $this->option_name );

			// Check for uid, install id & license key
			if ( empty( $activation_data['install_id'] ) || empty( $activation_data['activation_params']['uid'] ) || empty( $activation_data['activation_params']['license_key'] ) ) {
				return false;
			}

			return $activation_data['status'] === self::STATUS_ACTIVATED;
		}

		public function delete_all_data() {
			delete_option( $this->option_name );
		}

		public function get_license_key() {
			$activation_data = get_option( $this->option_name );
			if ( ! empty( $activation_data['activation_params']['license_key'] ) ) {
				return $activation_data['activation_params']['license_key'];
			}
			return '';
		}

		public function get_plan_name() {
			if ( $this->is_activated() ) {
				$activation_data = get_option( $this->option_name );
				if ( ! empty( $activation_data['install_data'] ) && ! empty( $activation_data['install_data']['license_plan_name'] ) ) {
					return $activation_data['install_data']['license_plan_name'];
				}
			}
			return '';
		}

		private function get_current_site_uid() {
			$blog_id = get_current_blog_id();
			$site_url = get_site_url( $blog_id );
			$site_url_parts = parse_url( $site_url );

			$data = [ $site_url_parts['host'], $blog_id ];
			if ( isset( $site_url_parts['path'] ) ) {
				$data[] = $site_url_parts['path'];
			}

			return md5( implode( '-', $data ) );
		}

		/**
		 * Get the latest plugin version from the API
		 * @return void
		 */
		public function get_latest() {
			if ( ! $this->is_activated() ) {
				return false;
			}

			$plugin_data = get_plugin_data( $this->plugin_main_file );
			$activation_data = get_option( $this->option_name );

			$install_api = new AuthenticatedApi(
				self::API_BASE_URL,
				'install',
				$activation_data['install_id'],
				$activation_data['install_data']['install_public_key'],
				$activation_data['install_data']['install_secret_key']
			);

			// Get the download URL for the latest version.
			$result = $install_api->get( "/updates/latest.json", [
				'is_premium' => 'true',
				'newer_than' => $plugin_data['Version'],
			] );
			$latest_release = json_decode( $result['body'], true );

			if ( isset( $latest_release['error'] ) ) {
				return new WP_Error( $latest_release['error']['code'], $latest_release['error']['message'] );
			}

			return $latest_release;
		}

		public function get_update_data() {
			$activation_data = get_option( $this->option_name );

			// On force-check, delete transient.
			if ( isset( $_GET['force-check'] ) ) {
				delete_transient( $this->option_name . '_update_data' );
			}

			$update_data = get_transient( $this->option_name . '_update_data' );
			if ( ! $update_data ) {
				$update_data = $this->get_latest();
				set_transient( $this->option_name . '_update_data', $update_data, DAY_IN_SECONDS );
			}

			return $update_data;
		}

		public function purge_plugin( $upgrader, $options ) {
			if ( 'update' === $options['action'] && 'plugin' === $options[ 'type' ] ) {
				// Clean the cache when new plugin version is installed
				delete_transient( $this->option_name . '_update_data' );
			}
		}

		public function plugins_api_filter( $data, $action = '', $args = null ) {
			// do nothing if you're not getting plugin information right now
			if ( 'plugin_information' !== $action ) {
				return $data;
			}

			// do nothing if it is not our plugin
			if ( $this->slug !== $args->slug ) {
				return $data;
			}

			// Only do this for activated plugins.
			if ( ! $this->is_activated() ) {
				return $data;
			}

			$plugin_data = get_plugin_data( $this->plugin_main_file );
			$update_data = $this->get_update_data();

			if ( empty( $update_data ) || is_wp_error( $update_data ) ) {
				return $data;
			}

			$data = $args;
			$data->name = $plugin_data['Name'];
			$data->author = $plugin_data['Author'];
			$data->sections = array(
				'description' => 'Upgrade ' . $plugin_data['Name'] . ' to latest.',
			);
			$data->version = $update_data['version'];
			$data->last_updated = ! is_null( $update_data['updated'] ) ? $update_data['updated'] : $update_data['created'];
			$data->requires = $update_data['requires_platform_version'];
			$data->requires_php = $update_data['requires_programming_language_version'];
			$data->tested = $update_data['tested_up_to_version'];
			$data->download_link = $update_data['url'];

			return $data;
		}

		public function update_plugin( $transient ) {
			if ( empty( $transient->checked ) ) {
				return $transient;
			}

			// Only do this for activated plugins.
			if ( ! $this->is_activated() ) {
				return $transient;
			}

			if ( ! function_exists( 'get_plugin_data' ) ) {
				require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
			}
			$plugin_data = get_plugin_data( $this->plugin_main_file );
			$update_data = $this->get_update_data();

			if (
				! empty( $update_data )
				&& ! is_wp_error( $update_data )
				&& version_compare( $plugin_data['Version'], $update_data['version'], '<' )
				&& version_compare( $update_data['requires_platform_version'], get_bloginfo( 'version' ), '<=' )
				&& version_compare( $update_data['requires_programming_language_version'], PHP_VERSION, '<' )
			) {
				$res = new stdClass();
				$res->slug = $this->slug;
				$res->plugin = plugin_basename( $this->plugin_main_file );
				$res->new_version = $update_data['version'];
				$res->tested = $update_data['requires_platform_version'];
				$res->package = $update_data['url'];

				$transient->response[ $res->plugin ] = $res;
	    	}

			return $transient;
		}

		/**
		 * Check if the current license is for a specific plan.
		 *
		 * @param string $plan
		 * @param bool $matching
		 * @return bool
		 */
		public function is_plan( $plan, $matching = true ) {
			$is_match = $this->get_plan_name() === $plan;
			return $matching ? $is_match : ! $is_match;
		}

		/**
		 * Helper functions that mimic some of Freemius' functions.
		 */
		public function can_use_premium_code() {
			return $this->is_activated();
		}

		public function is__premium_only() {
			return $this->is_activated();
		}
	}
}


if ( ! class_exists( 'Interact_Freemius_Admin' ) ) {
	class Interact_Freemius_Admin {

		/**
		 * The current instance of the class.
		 * @var Interact_Freemius_Admin
		 */
		private static $instance = null;

		/**
		 * Freemius instance
		 * @var Interact_Freemius
		 */
		private $freemius;

		/**
		 * Labels
		 * @var array
		 */
		public $labels = [];

		/**
		 * Show plan
		 * @var bool
		 */
		private $show_plan = false;

		/**
		 * Gets the current instance of the class.
		 *
		 * @param $freemius
		 * @param $args
		 * @return Interact_Freemius_Admin
		 */
		public static function get_instance( $freemius = null, $args = [] ) {
			if ( null === self::$instance ) {
				self::$instance = new self( $freemius, $args );
			}
			return self::$instance;
		}

		/**
		 * Interact_Freemius_Admin constructor.
		 *
		 * @param $freemius
		 * @param $args
		 */
		function __construct( $freemius, $args ) {
			$this->freemius = $freemius;
			$this->show_plan = $args['show_plan'];
			$this->labels = $args['labels'];

			// License activation/deactivation.
			add_action( 'plugin_action_links_' . plugin_basename( $this->freemius->plugin_main_file ), array( $this, 'add_plugin_action_links' ) );
			add_action( 'wp_ajax_interactfa_activate', array( $this, 'activate' ) );
			add_action( 'wp_ajax_interactfa_deactivate', array( $this, 'deactivate' ) );
			add_action( 'wp_ajax_interactfa_sync', array( $this, 'sync' ) );
		}

		public function get_license_key_modal_script() {
			$plugin_data = get_plugin_data( $this->freemius->plugin_main_file );
			$nonce = wp_create_nonce( 'wp_rest' );

			$dialog_class = 'form-activate';
			$license_key_value = '';
			$readonly_attribute = '';
			if ( $this->freemius->is_activated() ) {
				$dialog_class = 'form-manage';
				$license_key_value = $this->freemius->get_license_key();
				$readonly_attribute = 'readonly';
			}

			if ( ! function_exists( '__interact_esc_attr' ) ) {
				function __interact_esc_attr( $param ) {
					return esc_attr( $param );
				}
			}
			$esc_attr = '__interact_esc_attr';

			if ( ! function_exists( '__interact_mask_license_key' ) ) {
				function __interact_mask_license_key( $key ) {
					$length = strlen( $key );
					if ( $length < 9 ) {
						return str_repeat( '*', $length );
					}
					$start  = substr( $key, 0, 6 );
					$end    = substr( $key, -3 );
					$masked = str_repeat( '*', $length - 9 );

					return $start . $masked . $end;
				}
			}
			$mask_license_key = '__interact_mask_license_key';

			$modal_dialog = <<<LINK
<style>
.license_activate_dialog {
	padding: 0 !important;
	border: 0 !important;
	border-radius: 8px;
	box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;
	th, td {
		background: none !important;
	}
	th {
		padding: 20px 10px 20px 0 !important;
	}
	.submit {
		margin-top: 20px;
	}
	.dialog_content {
		padding: 24px 32px;
	}
	.result:empty {
		display: none;
	}
	.result {
		margin-block: 10px;
	}
	.result.err {
		color: #dc3545;
	}
	.result.success {
		color: #28a745;
	}
	.busy-spinner {
		width: 16px !important;
		height: 16px !important;
		float: none !important;
    	vertical-align: middle !important;
		display: none;
	}
	.license-key-help {
		color: #666;
		max-width: max(30vw, 500px);
		font-size: 13px;
	}
}

.license_activate_dialog.form-activate button.deactivate {
	display: none;
}

.license_activate_dialog.form-manage button.activate {
	display: none;
}
	
.license_activate_dialog.busy .busy-spinner {
	display: inline-block;
}
</style>
<dialog class="license_activate_dialog {$esc_attr( $dialog_class )}" id="dialog-{$esc_attr( $this->freemius->plugin_id )}">
	<div class="dialog_content">
		<h1>{$esc_attr( $this->labels['popup_title'] )}</h1>
		<p>{$esc_attr( $this->labels['popup_description'] )}</p>
		<form method="dialog">
			<table class="form-table" role="presentation">
				<tbody>
					<tr>
						<th>
							<label for="license_key-{$esc_attr( $this->freemius->plugin_id )}">{$esc_attr( $this->labels['license_key_field_label'] )}</label>
						</th>
						<td>
							<input type="text" name="license_key-{$esc_attr( $this->freemius->plugin_id )}" class="regular-text code license-key" required
								value="{$mask_license_key( $esc_attr( $license_key_value ) )}"
								{$readonly_attribute}
								oncopy="return false;"
							>
							<p class="license-key-help">{$esc_attr( $this->labels['license_key_field_help'] )}</p>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="description result"></div>
			<p class="submit">
				<button type="button" class="button close" onClick="dialog.close()">Cancel</button>
				<button type="button" class="button button-primary activate">{$esc_attr( $this->labels['activate_button'] )}</button>
				<button type="button" class="button button-primary deactivate">{$esc_attr( $this->labels['deactivate_button'] )}</button>
				<img src="{$esc_attr( includes_url( 'images/spinner.gif' ) )}" aria-hidden="true" class="busy-spinner"/>
			</p>
		</form>
	</div>
</dialog>
<script>
const dialog = document.querySelector('#dialog-{$esc_attr( $this->freemius->plugin_id )}');
dialog.addEventListener( 'click', function( event ) {
    if ( event.target === dialog ) {
		if ( ! dialog.classList.contains( 'busy' ) ) {
        	dialog.close();
		}
    }
} );
dialog.querySelector( 'button.close' ).addEventListener( 'click', function() { dialog.close() } );
dialog.querySelector( 'button.activate' ).addEventListener( 'click', function() {
	const result = dialog.querySelector( '.result' )
	const hasLicenseKey = dialog.querySelector( '.license-key' ).validity.valid
	if ( ! hasLicenseKey ) {
		result.classList.add( 'err' )
		result.classList.remove( 'success' )
		result.textContent = "{$esc_attr( $this->labels['no_license_key'] )}";
		return;
	}
	const licenseKey = dialog.querySelector( 'input.license-key' ).value;
	if ( licenseKey ) {
		dialog.classList.add( 'busy' )
		dialog.querySelector( 'button.close' ).disabled = true
		dialog.querySelector( 'button.activate' ).disabled = true
		wp.ajax.post( 'interactfa_activate', { license_key: btoa( licenseKey ), nonce: "{$esc_attr( $nonce )}" } ).done( function( success ) {
			result.classList.remove( 'err' )
			result.classList.add( 'success' )
			result.textContent = success;
			console.log('result', result);
			dialog.classList.remove( 'busy' )
			setTimeout( function() { window.location.reload() }, 1000 )
		}).fail( function ( error ) {
			result.classList.remove( 'success' )
			result.classList.add( 'err' )
			result.textContent = error;
			dialog.classList.remove( 'busy' )
			dialog.querySelector( 'button.close' ).disabled = false
			dialog.querySelector( 'button.activate' ).disabled = false
		});
	}
} );

dialog.querySelector( 'button.deactivate' ).addEventListener( 'click', function() {
	const result = dialog.querySelector( '.result' )
	dialog.classList.add( 'busy' )
	dialog.querySelector( 'button.close' ).disabled = true
	dialog.querySelector( 'button.deactivate' ).disabled = true
	wp.ajax.post( 'interactfa_deactivate', { nonce: "{$esc_attr( $nonce )}" } ).done( function( success ) {
		result.classList.remove( 'err' )
		result.classList.add( 'success' )
		result.textContent = success;
		console.log('result', result);
		dialog.classList.remove( 'busy' )
		setTimeout( function() { window.location.reload() }, 1000 )
	}).fail( function( error ) {
		result.classList.remove( 'success' )
		result.classList.add( 'err' )
		result.textContent = error;
		dialog.classList.remove( 'busy' )
		dialog.querySelector( 'button.close' ).disabled = false
		dialog.querySelector( 'button.deactivate' ).disabled = false
	});
} );

</script>
LINK;

			return [
				'html' => $modal_dialog,
				'id' => "dialog-{$esc_attr( $this->freemius->plugin_id )}",
			];
		}

		/**
		 * Add action links to the plugin page
		 *
		 * @param array $links
		 * @return array
		 */
		public function add_plugin_action_links( $links ) {
			// Activate / Manage license key.
			$link_label = esc_attr( $this->labels['activate_license'] );
			if ( $this->freemius->is_activated() ) {
				$link_label = esc_attr( $this->labels['manage_license'] );
				if ( $this->show_plan ) {
					$link_label .= ': ' . ucfirst( $this->freemius->get_plan_name() );
				}
			}

			$modal = $this->get_license_key_modal_script();
			$license = $modal['html'] .
				"<a href=\"javascript:document.querySelector('#{$modal['id']}').showModal();void(0)\">{$link_label}</a>";

			$new_links = array( 'license_key' => $license );

			// Sync license.
	// 		if ( $this->freemius->is_activated() ) {
	// 			$r = rand( 0, 10000 );
	// 			$nonce = esc_attr( wp_create_nonce( 'wp_rest' ) );
	// 			$link_label = esc_attr( $this->labels['sync_button'] );
	// 			$sync = <<< SYNCHTML
	// <script>
	// function sync_{$r}() {
	// 	wp.ajax.post( 'interactfa_sync', { nonce: "{$nonce}" } ).done( success => {
	// 		window?.alert( success );
	// 	} ).fail( error => {
	// 		window?.alert( error );
	// 	} )
	// }
	// </script>
	// SYNCHTML;
	// 			$sync .= "<a href=\"javascript:sync_{$r}();void(0)\">{$link_label}</a>";

	// 			$new_links['sync'] = $sync;
	// 		}

			// Merge like this so that our license key is the first link.
			$links = array_merge( $new_links, $links );
			return $links;
		}

		/**
		 * Activate license key
		 */
		public function activate() {
			$nonce = sanitize_text_field( $_POST['nonce'] );
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				wp_send_json_error( $this->labels['invalid_nonce'] );
			}

			// Note that the license key is passed as base64 encoded because it
			// can contain characters that can be sanitized out.
			$license_key = base64_decode( sanitize_text_field( $_POST['license_key'] ) );
			if ( empty( $license_key ) ) {
				wp_send_json_error( $this->labels['no_license_key'] );
			}

			$result = $this->freemius->activate_license_key( $license_key );
			if ( $result === true ) {
				wp_send_json_success( $this->labels['activation_success'] );
			} else {
				wp_send_json_error( $result->get_error_message() );
			}
		}

		/**
		 * Deactivate license key
		 */
		public function deactivate() {
			$nonce = sanitize_text_field( $_POST['nonce'] );
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				wp_send_json_error( $this->labels['invalid_nonce'] );
			}

			$result = $this->freemius->deactivate();
			if ( $result === true ) {
				wp_send_json_success( $this->labels['deactiation_success'] );
			} else {
				wp_send_json_error( $result->get_error_message() );
			}
		}

		/**
		 * Syncs the license key
		 */
		public function sync() {
			$nonce = sanitize_text_field( $_POST['nonce'] );
			if ( ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
				wp_send_json_error( $this->labels['invalid_nonce'] );
			}

			// The license key is already saved.
			$result = $this->freemius->sync_license();
			if ( $result === true ) {
				wp_send_json_success( $this->labels['sync_success'] );
			} else {
				wp_send_json_error( $this->labels['no_license_key'] );
			}
		}
	}
}
