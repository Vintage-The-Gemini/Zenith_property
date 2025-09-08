import winston from 'winston'
import path from 'path'

const { combine, timestamp, errors, printf, colorize, json } = winston.format

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

// Custom format for file output
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
)

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { 
    service: 'palvoria-properties-backend',
    version: '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        consoleFormat
      ),
      silent: process.env.NODE_ENV === 'test'
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join('logs', 'app.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'exceptions.log'),
      format: fileFormat
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join('logs', 'rejections.log'),
      format: fileFormat
    })
  ],
  
  exitOnError: false
})

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs'
try {
  mkdirSync('logs', { recursive: true })
} catch (error) {
  // Directory already exists or permission error
}

// Add request logging method
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  }
  
  if (res.statusCode >= 400) {
    logger.error('HTTP Request Error', logData)
  } else {
    logger.info('HTTP Request', logData)
  }
}

// Add WebSocket logging method
logger.logWebSocket = (event, userId, data = {}) => {
  const logData = {
    event,
    userId,
    ...data,
    timestamp: new Date().toISOString()
  }
  
  logger.info('WebSocket Event', logData)
}

// Add performance logging method
logger.logPerformance = (operation, duration, metadata = {}) => {
  const logData = {
    operation,
    duration: `${duration}ms`,
    ...metadata,
    timestamp: new Date().toISOString()
  }
  
  if (duration > 1000) {
    logger.warn('Slow Operation', logData)
  } else {
    logger.info('Performance', logData)
  }
}

// Add database logging method
logger.logDatabase = (operation, collection, duration, error = null) => {
  const logData = {
    operation,
    collection,
    duration: duration ? `${duration}ms` : undefined,
    error: error?.message,
    timestamp: new Date().toISOString()
  }
  
  if (error) {
    logger.error('Database Error', logData)
  } else if (duration > 500) {
    logger.warn('Slow Database Query', logData)
  } else {
    logger.info('Database Operation', logData)
  }
}

// Add security logging method
logger.logSecurity = (event, userId, details = {}) => {
  const logData = {
    event,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
    severity: 'security'
  }
  
  logger.warn('Security Event', logData)
}

export default logger