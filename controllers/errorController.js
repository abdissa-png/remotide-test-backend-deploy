const AppError = require('./../helpers/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);
const handleJWTExpiredError = () =>
  new AppError('Token expired. Please login again!', 401);

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : Object.keys(err.keyValue);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message // Include error message in the response body
    });

  // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};
// Global error handling middleware
module.exports = (err, req, res, next) => {
  // Debugging: Log the error object to inspect its properties
  console.log('Error object:', err);

  // Set default status code if not already set
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  let error = new AppError(err.message, statusCode);
  error.status = status;
  error.isOperational = true;

  // Debugging: Log the error name to identify the type of error
  console.log('Error name:', error.name);

  // Customize error handling based on error types
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Debugging: Log the error message before sending the response
  console.log('Error message:', error.message);

  sendErrorProd(error, res); // Ensure that sendErrorProd function is called here
};



