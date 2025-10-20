<?php

    namespace FSLite\Data;

    use InvalidArgumentException;

    class License
    {

        const ACTIVE   = 'active';
        const INACTIVE = 'inactive';
        const EXPIRED  = 'expired';
        const MISSING  = 'missing';
        private $firstName;
        private $installId;
        private $lastName;
        private $licenseKey;
        private $productId;
        private $userEmail;
        private $userId;
        private $uid;
        private $url;
        private $errors = array();

        private function camelCaseToSnakeCase(string $input): string
        {
            return strtolower(preg_replace('/[A-Z]/', '_$0', lcfirst($input)));
        }

        public function toArray(): array
        {
            $result     = array();
            $properties = get_object_vars($this);

            foreach ($properties as $key => $value)
            {
                if ( ! is_null($value))
                {
                    $snakeCaseKey          = $this->camelCaseToSnakeCase($key);
                    $result[$snakeCaseKey] = $value;
                }
            }

            return $result;
        }

        public function isValidForActivation(): bool
        {
            $this->errors = array();
            if (empty($this->licenseKey))
            {
                $this->errors[] = 'Missing License Key';
            }
            if ((int) $this->productId <= 0)
            {
                $this->errors[] = 'Missing Product Id';
            }

            return count($this->errors) === 0;
        }

        public function isValidForDeactivation(): bool
        {
            $this->errors = array();
            if (empty($this->licenseKey))
            {
                $this->errors[] = 'Missing License Key';
            }
            if ((int) $this->productId <= 0)
            {
                $this->errors[] = 'Missing Product Id';
            }
            if (empty($this->uid))
            {
                $this->errors[] = 'Missing Site UID';
            }
            if ((int) $this->installId <= 0)
            {
                $this->errors[] = 'Missing InstallId';
            }

            return count($this->errors) === 0;
        }

        /**
         * Gets the errors as a string.
         *
         * @return string The errors joined as a string.
         */
        public function getErrors(): string
        {
            return join("\n", $this->errors);
        }

        /**
         * Validates the email format.
         *
         * @param string $pEmail The email to validate.
         *
         * @throws InvalidArgumentException If the email format is invalid.
         */
        private function validateEmail(string $pEmail)
        {
            if ( ! filter_var($pEmail, FILTER_VALIDATE_EMAIL))
                throw new InvalidArgumentException('Invalid email format');
        }

        /**
         * Validates the URL format.
         *
         * @param string $pUrl The URL to validate.
         *
         * @throws InvalidArgumentException If the URL format is invalid.
         */
        private function validateUrl(string $pUrl)
        {
            if ( ! filter_var($pUrl, FILTER_VALIDATE_URL))
                throw new InvalidArgumentException('Invalid URL format');
        }

        /**
         * Validates the string is not empty.
         *
         * @param string $pString The string to validate.
         *
         * @throws InvalidArgumentException If the string is empty.
         */
        private function validateString(string $pString)
        {
            if (empty($pString))
                throw new InvalidArgumentException('String cannot be empty');
        }

        /**
         * Validates the integer format.
         *
         * @param int $pInteger The integer to validate.
         *
         * @throws InvalidArgumentException If the integer format is invalid.
         */
        private function validateInteger(int $pInteger)
        {
            if ( ! filter_var($pInteger, FILTER_VALIDATE_INT))
                throw new InvalidArgumentException('Invalid integer format');
        }

        // Getters and Setters with validation

        /**
         * Gets the license key.
         *
         * @return string The license key.
         */
        public function getLicenseKey(): string
        {
            return $this->licenseKey;
        }

        /**
         * Sets the license key.
         *
         * @param string $pLicenseKey The license key to set.
         */
        public function setLicenseKey(string $pLicenseKey)
        {
            $this->validateString($pLicenseKey);
            $this->licenseKey = $pLicenseKey;
        }

        /**
         * Gets the product ID.
         *
         * @return int The product ID.
         */
        public function getProductId(): int
        {
            return $this->productId;
        }

        /**
         * Sets the plugin ID.
         *
         * @param int $pPluginId The plugin ID to set.
         */
        public function setPluginId(int $pPluginId)
        {
            $this->setProductId($pPluginId);
        }

        /**
         * Sets the theme ID.
         *
         * @param int $pThemeId The theme ID to set.
         */
        public function setThemeId(int $pThemeId)
        {
            $this->setProductId($pThemeId);
        }

        /**
         * Sets the product ID.
         *
         * @param int $pProductId The product ID to set.
         */
        public function setProductId(int $pProductId)
        {
            $this->validateInteger($pProductId);
            $this->productId = $pProductId;
        }

        /**
         * Gets the user ID.
         *
         * @return int The user ID.
         */
        public function getUserId(): int
        {
            return $this->userId;
        }

        /**
         * Sets the user ID.
         *
         * @param int $pUserId The user ID to set.
         */
        public function setUserId(int $pUserId)
        {
            $this->validateInteger($pUserId);
            $this->userId = $pUserId;
        }

        /**
         * Gets the URL.
         *
         * @return string The URL.
         */
        public function getUrl(): string
        {
            return $this->url ?? '';;
        }

        /**
         * Sets the URL.
         *
         * @param string $pUrl The URL to set.
         */
        public function setUrl(string $pUrl)
        {
            $this->validateUrl($pUrl);
            $this->url = $pUrl;
        }

        /**
         * Gets the UID.
         *
         * @return string The UID.
         */
        public function getUid(): string
        {
            return $this->uid ?? '';;
        }

        /**
         * Sets the UID.
         *
         * @param string $pUid The UID to set.
         */
        public function setUid(string $pUid)
        {
            $this->validateString($pUid);
            $this->uid = $pUid;
        }

        /**
         * Gets the user email.
         *
         * @return string The user email.
         */
        public function getUserEmail(): string
        {
            return $this->userEmail;
        }

        /**
         * Sets the user email.
         *
         * @param string $pUserEmail The user email to set.
         */
        public function setUserEmail(string $pUserEmail)
        {
            $this->validateEmail($pUserEmail);
            $this->userEmail = $pUserEmail;
        }

        /**
         * Gets the first name.
         *
         * @return string The first name.
         */
        public function getFirstName(): string
        {
            return $this->firstName;
        }

        /**
         * Sets the first name.
         *
         * @param string $pFirstName The first name to set.
         */
        public function setFirstName(string $pFirstName)
        {
            $this->validateString($pFirstName);
            $this->firstName = $pFirstName;
        }

        /**
         * Gets the last name.
         *
         * @return string The last name.
         */
        public function getLastName(): string
        {
            return $this->lastName;
        }

        /**
         * Sets the last name.
         *
         * @param string $pLastName The last name to set.
         */
        public function setLastName(string $pLastName)
        {
            $this->validateString($pLastName);
            $this->lastName = $pLastName;
        }

        /**
         * Gets the installation ID.
         *
         * @return int The installation ID.
         */
        public function getInstallId(): int
        {
            return $this->installId;
        }

        /**
         * Sets the installation ID.
         *
         * @param int $pInstallId The installation ID to set.
         */
        public function setInstallId(int $pInstallId)
        {
            $this->validateInteger($pInstallId);
            $this->installId = $pInstallId;
        }

        /**
         * Create an instance of LicenseParams from an array.
         * This method iterates over the input array, sanitizes the values, and sets them to the corresponding properties.
         *
         * @param array $data The input array containing the data to populate the object.
         *
         * @return self An instance of LicenseParams with properties set from the input array.
         */
        public static function fromArray(array $data): self
        {
            $instance = new self();

            foreach ($data as $key => $value)
            {
                $instance->add($key, $value);
            }

            return $instance;
        }

        public function add($key, $value)
        {
            if ( ! empty($value))
            {
                $method = 'set' . str_replace(' ', '', ucwords(str_replace('_', ' ', $key)));
                if (method_exists($this, $method))
                {
                    $sanitizedValue = self::sanitizeInput($key, $value);
                    $this->$method($sanitizedValue);
                }
            }
        }

        /**
         * Sanitize input values based on their key.
         * This method applies appropriate sanitization functions depending on the type of the input.
         *
         * @param string $key   The key of the input array which indicates the type of value.
         * @param mixed  $value The value to be sanitized.
         *
         * @return int|string The sanitized value.
         */
        private static function sanitizeInput(string $key, $value)
        {
            switch ($key)
            {
                case 'product_id':
                case 'user_id':
                case 'install_id':
                    return (int) wp_unslash($value);
                case 'user_email':
                    return sanitize_email(wp_unslash($value));
                case 'url':
                    return esc_url_raw(wp_unslash($value));
                case 'license_key':
                case 'first_name':
                case 'last_name':
                case 'uid':
                default:
                    return sanitize_text_field(wp_unslash($value));
            }
        }

        public function setIfMissing(string $key, string $value)
        {
            $method        = 'get' . str_replace(' ', '', ucwords(str_replace('_', ' ', $key)));
            $current_value = $this->$method();
            if (empty($current_value))
            {
                $this->add($key, $value);
            }
        }
    }
