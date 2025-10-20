<?php

    namespace FSLite\Api;

    /**
     * Class AuthenticatedApi
     *
     * This class provides methods to perform HTTP requests to an authenticated API.
     * The base URL of the API is passed to the constructor, and each request method accepts an endpoint and optional parameters or data to be sent.
     *
     * Usage Example:
     * $api = new AuthenticatedApi('user', '3534', '12345678901234567890123456789012', 'abcdefghijklmnopqrstuvwxyzabcdef');
     * $response = $api->get('/licenses', ['plugin_id' => '1524']);
     *
     * @package FSLite
     */

    use WP_Error;

    class AuthenticatedApi extends PublicApi
    {

        private $publicKey;

        private $secretKey;

        private $id;

        /**
         * @var 'user'|'install'
         */
        private $scope;

        /**
         * AuthenticatedApi constructor.
         *
         * @param string $pScope     Type of scope (e.g., plugin, user, install)
         * @param string $pId        Entity ID
         * @param string $pPublicKey Public key for authentication
         * @param string $pSecretKey Secret key for authentication
         */
        public function __construct(
			string $pApiBaseUrl,
            string $pScope,
            string $pId,
            string $pPublicKey,
            string $pSecretKey
        ) {
            parent::__construct($pApiBaseUrl);
            $this->scope     = $pScope;
            $this->id        = $pId;
            $this->publicKey = $pPublicKey;
            $this->secretKey = $pSecretKey;
        }

        /**
         * Perform a GET request with authentication.
         *
         * @param string $pEndpoint API endpoint
         * @param array  $pParams   Query parameters
         *
         * @return array|WP_Error
         */
        public function get(string $pEndpoint, array $pParams = [])
        {
            return $this->prepareRequest('GET', $pEndpoint, $pParams);
        }

        /**
         * Perform a POST request with authentication.
         *
         * @param string $pEndpoint API endpoint
         * @param array  $pData     Data to be sent in the request body
         *
         * @return array|WP_Error
         */
        public function post(string $pEndpoint, array $pData = [])
        {
            return $this->prepareRequest('POST', $pEndpoint, $pData);
        }

        /**
         * Perform a PUT request with authentication.
         *
         * @param string $pEndpoint API endpoint
         * @param array  $pData     Data to be sent in the request body
         *
         * @return array|WP_Error
         */
        public function put(string $pEndpoint, array $pData = [])
        {
            return $this->prepareRequest('PUT', $pEndpoint, $pData);
        }

        /**
         * Perform a DELETE request with authentication.
         *
         * @param string $pEndpoint API endpoint
         * @param array  $pData     Data to be sent in the request body
         *
         * @return array|WP_Error
         */
        public function delete(string $pEndpoint, array $pData = [])
        {
            return $this->prepareRequest('DELETE', $pEndpoint, $pData);
        }

        /**
         * Generate signature signed headers for the request.
         *
         * @param string $pResourceUrl Resource URL
         * @param string $pMethod      HTTP method
         * @param array  $pPostParams  Parameters for POST requests
         * @param string $pId          Entity ID
         * @param string $pPublic      Public key
         * @param string $pSecret      Secret key
         *
         * @return array
         */
        private function getSignatureSignedHeaders(
            string $pResourceUrl,
            string $pMethod,
            array $pPostParams,
            string $pId,
            string $pPublic,
            string $pSecret
        ): array {
            $method       = strtoupper($pMethod);
            $eol          = "\n";
            $content_md5  = '';
            $content_type = '';
            $date         = date('r', time());

            if (in_array($pMethod, array('POST', 'PUT')))
            {
                $content_type = 'application/json';
            }

            if ( ! empty($pPostParams))
            {
                $content_md5 = md5(json_encode($pPostParams));
            }

            $string_to_sign = implode($eol, array(
                $method,
                $content_md5,
                $content_type,
                $date,
                $pResourceUrl,
            ));

            // If secret and public keys are identical, it means that
            // the signature uses public key hash encoding.
            $auth_type = ($pSecret !== $pPublic) ? 'FS' : 'FSP';
            $hash      = hash_hmac('sha256', $string_to_sign, $pSecret);
            $hash      = base64_encode($hash);
            $hash      = strtr($hash, '+/', '-_');
            $hash      = str_replace('=', '', $hash);

            $auth = array(
                'Date'          => $date,
                'Authorization' => "$auth_type $pId:$pPublic:$hash",
            );

            if ( ! empty($content_md5))
            {
                $auth['Content-MD5'] = $content_md5;
            }

            return $auth;
        }

        /**
         * Prepare an authenticated request.
         *
         * @param string $pMethod   HTTP method
         * @param string $pEndpoint API endpoint
         * @param array  $pData     Data to be sent in the request
         *
         * @return array|WP_Error
         */
        private function prepareRequest(
            string $pMethod,
            string $pEndpoint,
            array $pData = []
        )
        {
            $url_parts         = array(
                '',
                'v1',
                $this->scope . 's',
                $this->id,
                ltrim($pEndpoint, '/'),
            );
            $complete_endpoint = join('/', $url_parts);
            $url               = $this->api_base_url . $complete_endpoint;

            if ($pMethod === 'GET' && ! empty($pData))
            {
                $url   .= '?' . http_build_query($pData);
                $pData = [];
            }

            $headers = $this->getSignatureSignedHeaders(
                $complete_endpoint,
                $pMethod,
                $pData,
                $this->id,
                $this->publicKey,
                $this->secretKey
            );

            return $this->performHttpRequest($url, $pMethod, $headers, $pData);
        }

        /**
         * Execute the HTTP request.
         *
         * @param string $pUrl     Request URL
         * @param string $pMethod  HTTP method
         * @param array  $pHeaders Request headers
         * @param mixed  $pBody    Request body
         *
         * @return array|WP_Error
         */
        private function performHttpRequest(string $pUrl, string $pMethod, array $pHeaders, $pBody)
        {
            $headers = $pHeaders;
            $method  = strtoupper($pMethod);
            if (in_array($method, array('POST', 'PUT')))
            {
                $headers['Content-type'] = 'application/json';
                $body                    = json_encode($pBody);
            }
            else
            {
                $body = $pBody;
            }

            $args = array(
                'method'           => $method,
                'connect_timeout'  => 10,
                'timeout'          => 60,
                'follow_redirects' => true,
                'redirection'      => 5,
                'user-agent'       => 'WordPress/' . get_bloginfo('version') . '; ' . home_url('/'),
                'blocking'         => true,
                'headers'          => $headers,
                'body'             => $body,
            );

            // Leverage WP core
            return wp_remote_request($pUrl, $args);
        }
    }
