import logger from '../utils/logger.js'

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(`Error ${err.message}`, {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = { message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, statusCode: 401 }
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files'
    error = { message, statusCode: 400 }
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected field'
    error = { message, statusCode: 400 }
  }

  // Rate limit errors
  if (err.message && err.message.includes('Too many requests')) {
    error = { message: err.message, statusCode: 429 }
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    const message = 'Database connection error'
    error = { message, statusCode: 503 }
  }

  // Redis connection errors
  if (err.code === 'ECONNREFUSED' && err.address === '127.0.0.1') {
    logger.warn('Redis connection failed, continuing without cache')
    // Don't return error for Redis failures, just log and continue
    return res.status(200).json({
      success: true,
      message: 'Operation completed (cache unavailable)'
    })
  }

  // Socket.IO errors
  if (err.type === 'entity.parse.failed') {
    const message = 'Invalid JSON payload'
    error = { message, statusCode: 400 }
  }

  // Default error response
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  // Prepare error response
  const errorResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error
    })
  }

  // Add request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId
  }

  // Security: Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Only expose safe error messages in production
    if (statusCode === 500) {
      errorResponse.error = 'Internal Server Error'
    }
    
    // Remove stack trace and details
    delete errorResponse.stack
    delete errorResponse.details
  }

  // Log security-related errors separately
  if (statusCode === 401 || statusCode === 403) {
    logger.logSecurity('authentication_error', req.user?.id, {
      url: req.originalUrl,
      method: req.method,
      error: message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
  }

  // Send error response
  res.status(statusCode).json(errorResponse)
}

export default errorHandler