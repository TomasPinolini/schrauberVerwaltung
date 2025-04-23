class AppError extends Error {
    constructor(message, statusCode, code = 'UNKNOWN_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: {
                message: err.message,
                code: err.code,
                stack: err.stack
            }
        });
    } else {
        res.status(err.statusCode).json({
            status: err.status,
            error: {
                message: err.message,
                code: err.code
            }
        });
    }
};

module.exports = {
    AppError,
    errorHandler
}; 