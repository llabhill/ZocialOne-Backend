const jwt = require('jsonwebtoken');


function authMiddleware(req, res, next) {
  try {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied!!Token is missing...',
      });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }
    req.userId = decoded.userId;
    next();
  } 
  catch (err) {

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
    }

    console.error('Auth middleware error:', err);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
}

module.exports = authMiddleware;
