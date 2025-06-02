const logger = {
    info: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    warning: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[WARNING] ${message}`, ...args);
        }
    },
    error: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.error(`[ERROR] ${message}`, ...args);
        }
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
};

export default logger; 