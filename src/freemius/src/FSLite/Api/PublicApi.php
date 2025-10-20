<?php

    namespace FSLite\Api;

    use WP_Error;

    /**
     * Class PublicApi
     *
     * This class provides methods to perform HTTP requests to a public API.
     * The base URL of the API is passed to the constructor, and each request method accepts an endpoint and optional parameters or data to be sent.
     *
     * Usage Example:
     * $api = new PublicApi('https://api.example.com');
     * $response = $api->get('/users', ['page' => 1]);
     *
     * @package FSLite
     */
    class PublicApi
    {

        /**
         * The base URL of the API.
         *
         * @var string
         */
        protected $api_base_url;

        /**
         * PublicApi constructor.
         *
         * @param string $pApiBaseUrl
         */
        public function __construct(string $pApiBaseUrl)
        {
            $this->api_base_url = rtrim($pApiBaseUrl, '/');
        }

        /**
         * Perform a GET request.
         *
         * @param string $pEndpoint
         * @param array  $pParams
         *
         * @return array|WP_Error
         */
        public function get(string $pEndpoint, array $pParams = [])
        {
            $url = $this->api_base_url . '/' . ltrim($pEndpoint, '/') . '?' . http_build_query($pParams);

            return $this->performHttpRequest('GET', $url);
        }

        /**
         * Perform a POST request.
         *
         * @param string $pEndpoint
         * @param array  $pData
         *
         * @return array|WP_Error
         */
        public function post(string $pEndpoint, array $pData = [])
        {
            $url = $this->api_base_url . '/' . ltrim($pEndpoint, '/');

            return $this->performHttpRequest('POST', $url, $pData);
        }

        /**
         * Perform a PUT request.
         *
         * @param string $pEndpoint
         * @param array  $pData
         *
         * @return array|WP_Error
         */
        public function put(string $pEndpoint, array $pData = [])
        {
            $url = $this->api_base_url . '/' . ltrim($pEndpoint, '/');

            return $this->performHttpRequest('PUT', $url, $pData);
        }

        /**
         * Perform a DELETE request.
         *
         * @param string $pEndpoint
         * @param array  $pData
         *
         * @return array|WP_Error
         */
        public function delete(string $pEndpoint, array $pData = [])
        {
            $url = $this->api_base_url . '/' . ltrim($pEndpoint, '/');

            return $this->performHttpRequest('DELETE', $url, $pData);
        }

        /**
         * Execute the HTTP request.
         *
         * @param string $pMethod HTTP method
         * @param string $pUrl    Request URL
         * @param array  $pData   Request body
         *
         * @return array|WP_Error
         */
        private function performHttpRequest(string $pMethod, string $pUrl, array $pData = [])
        {
            $pMethod = strtoupper($pMethod);
            $body    = null;

            if (in_array($pMethod, ['POST', 'PUT', 'DELETE']))
            {
                $body = json_encode($pData);
            }

            $headers = [
                'Content-Type' => 'application/json',
                'User-Agent'   => 'WordPress/' . get_bloginfo('version') . '; ' . home_url('/'),
            ];

            $args = [
                'method'           => $pMethod,
                'connect_timeout'  => 10,
                'timeout'          => 60,
                'follow_redirects' => true,
                'redirection'      => 5,
                'blocking'         => true,
                'headers'          => $headers,
                'body'             => $body,
            ];

            return wp_remote_request($pUrl, $args);
        }

        /**
         * @param $response
         *
         * Double check responses for errors
         *
         * @return mixed|WP_Error
         */
        public function validateResponse($response)
        {
            if (is_wp_error($response))
                return $response;

            if (isset($response['error']))
                return new WP_Error($response['error']['code'], $response['error']['message']);

            $response_body = json_decode($response['body'], true);

            if (isset($response_body['error']))
                return new WP_Error($response_body['error']['code'], $response_body['error']['message']);

            return $response_body;
        }
    }
