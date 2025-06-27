const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.accessToken;
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Không có token hoặc token không hợp lệ' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    console.error('Error verifying token:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    res.status(500).json({ message: 'Lỗi khi xác thực token' });
  }
};