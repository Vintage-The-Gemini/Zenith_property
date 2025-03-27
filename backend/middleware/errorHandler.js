// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: Object.values(err.errors).map(error => error.message)
      });
    }
  
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate Error',
        message: 'A record with this information already exists'
      });
    }
  
    if (err.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'One or more IDs provided are invalid'
      });
    }
  
    if (err.name === 'MulterError') {
      return res.status(400).json({
        error: 'File Upload Error',
        message: err.message
      });
    }
  
    return res.status(500).json({
      error: 'Server Error',
      message: 'An unexpected error occurred'
    });
  };
  
  export default errorHandler;

  //testing change in commits