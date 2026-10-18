const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  // Kiểm tra định dạng Bearer Token hợp lệ
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'email']
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user.toJSON();

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Auth Middleware Error:', error.message); 
    
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = requireAuth;
