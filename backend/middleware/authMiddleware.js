const jwt = require('jsonwebtoken');
const AWSXRay = require('aws-xray-sdk');
const User = require('../models/User');

// Middleware xác thực JWT
module.exports.authMiddleware = async (req, res, next) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - FindUser') : null;
  try {
    // Kiểm tra JWT_SECRET
    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      subsegment?.close(new Error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined'));
      console.error('authMiddleware - JWT_SECRET or REFRESH_TOKEN_SECRET is not defined');
      return res.status(500).json({ message: 'Lỗi cấu hình server' });
    }

    // Kiểm tra token
    console.log('authMiddleware - Checking authorization for:', req.originalUrl);
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else {
      subsegment?.close(new Error('No token provided'));
      return res.status(401).json({ message: 'Thiếu token xác thực' });
    }

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm người dùng
    const user = await User.findById(decoded.userId);
    if (!user) {
      subsegment?.close(new Error('User not found'));
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Gắn thông tin user vào request
    req.user = { userId: user._id.toString(), role: user.role };

    subsegment?.close();
    next();
  } catch (err) {
    subsegment?.close(err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Middleware kiểm tra quyền admin
module.exports.checkAdmin = (req, res, next) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('CheckAdminAuthorization') : null;
  try {
    if (!req.user || req.user.role !== 'admin') {
      console.log('checkAdmin - Access denied, user is not admin:', req.user);
      subsegment?.close(new Error('User is not admin'));
      return res.status(403).json({ message: 'Chỉ admin được phép thực hiện' });
    }
    subsegment?.close();
    next();
  } catch (err) {
    subsegment?.close(err);
    console.error('checkAdmin - Error:', err.message);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

module.exports.optionalAuthMiddleware = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (err) {
    // Nếu token sai thì bỏ qua không làm crash
  }
  next();
};