const config = {
    API_URL: process.env.REACT_APP_API_URL || '/api',
    EMAIL_SERVICE: {
        HOST: process.env.REACT_APP_EMAIL_HOST,
        PORT: process.env.REACT_APP_EMAIL_PORT,
        USER: process.env.REACT_APP_EMAIL_HOST_USER,
        PASSWORD: process.env.REACT_APP_EMAIL_HOST_PASSWORD,
        USE_TLS: process.env.REACT_APP_EMAIL_USE_TLS === 'True',
        ENCRYPTION_KEY: process.env.REACT_APP_EMAIL_ENCRYPTION_KEY || 'jaj9qouzOs-ACsia3xikjwEvv9es_3lzoKF6Csei8-4='
    },
    ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'jaj9qouzOs-ACsia3xikjwEvv9es_3lzoKF6Csei8-4=',
    DEBUG: process.env.REACT_APP_DEBUG === 'true'
};

export default config; 