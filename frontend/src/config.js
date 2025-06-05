const config = {
    API_URL: process.env.REACT_APP_API_URL || 'http://185.135.83.113:8000',
    EMAIL_SERVICE: {
        HOST: process.env.REACT_APP_EMAIL_HOST,
        PORT: process.env.REACT_APP_EMAIL_PORT,
        USER: process.env.REACT_APP_EMAIL_HOST_USER,
        PASSWORD: process.env.REACT_APP_EMAIL_HOST_PASSWORD,
        USE_TLS: process.env.REACT_APP_EMAIL_USE_TLS === 'True'
    },
    ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY,
    DEBUG: process.env.REACT_APP_DEBUG === 'true'
};

export default config; 