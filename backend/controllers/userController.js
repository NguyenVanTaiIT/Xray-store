const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AWSXRay = require('aws-xray-sdk');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

// Kiểm tra biến môi trường
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables');
}
if (!process.env.NODE_ENV) {
  throw new Error('NODE_ENV is not defined in environment variables');
}
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

exports.register = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - Register') : null;
  try {
    console.log('Register request:', { body: req.body, JWT_SECRET: !!process.env.JWT_SECRET });
    const { email, password, name, phone, address } = req.body;
    if (!email || !password || !name || !phone) {
      subsegment?.close(new Error('Missing required fields'));
      return res.status(400).json({ message: 'Vui lòng cung cấp email, mật khẩu, tên và số điện thoại' });
    }
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/)) {
      subsegment?.close(new Error('Invalid password format'));
      return res.status(400).json({
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự, 1 chữ hoa, 1 chữ thường và 1 số'
      });
    }
    if (!phone.match(/^(\+84|0)\d{9,10}$/)) {
      subsegment?.close(new Error('Invalid phone format'));
      return res.status(400).json({
        message: 'Số điện thoại phải bắt đầu bằng +84 hoặc 0 và có 10-11 chữ số'
      });
    }
    if (address && (!address.district || !address.city)) {
      subsegment?.close(new Error('Missing district or city'));
      return res.status(400).json({ message: 'Quận/huyện và thành phố là bắt buộc' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      subsegment?.close(new Error('Email already exists'));
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    const user = new User({
      email,
      password, // Đảm bảo password được hash trong User model (pre-save hook)
      name,
      phone,
      address: {
        street: address?.street || '',
        ward: address?.ward || '',
        district: address?.district || '',
        city: address?.city || '',
        zipCode: address?.zipCode || ''
      },
      role: 'user'
    });
    await user.save();
    console.log('User saved:', user._id);
    subsegment?.close();
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { id: user._id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      accessToken
    });
  } catch (err) {
    console.error('Register error:', { message: err.message, stack: err.stack, code: err.code });
    subsegment?.close(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã tồn tại' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi đăng ký', error: err.message });
  }
};

exports.login = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - Login') : null;
  try {
    console.log(`Login request for email: ${req.body.email}`);
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      subsegment?.close(new Error('Missing email or password'));
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      subsegment?.close(new Error('User not found'));
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      subsegment?.close(new Error('Invalid password'));
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();
    subsegment?.close();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: rememberMe
        ? 30 * 24 * 60 * 60 * 1000 // 30 days
        : 24 * 60 * 60 * 1000,    // 1 day
      path: '/api/users'
    });

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        joinDate: user.createdAt
      },
      accessToken
    });
  } catch (err) {
    console.error('Error logging in:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi đăng nhập', error: err.message });
  }
};


exports.refreshToken = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - RefreshToken') : null;
  try {
    console.log('Refreshing token');
    const { refreshToken } = req.cookies;
    // User model already imported

    if (!refreshToken) {
      subsegment?.close(new Error('No refresh token provided'));
      return res.status(401).json({ message: 'Không tìm thấy refresh token' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    console.log('User found:', user ? { _id: user._id, role: user.role } : 'No user');

    if (!user || user.refreshToken !== refreshToken) {
      subsegment?.close(new Error('Invalid refresh token'));
      return res.status(401).json({ message: 'Refresh token không hợp lệ' });
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 3600000,
      path: '/'
    });

    subsegment?.close();
    res.status(200).json({ message: 'Refresh token thành công', accessToken });
  } catch (err) {
    console.error('Error refreshing token:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Refresh token không hợp lệ' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi refresh token', error: err.message });
  }
};

exports.logout = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - Logout') : null;
  try {
    console.log(`Logging out user: ${req.user?.userId}`);
    const { refreshToken } = req.cookies;
    // User model already imported

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
        console.log(`Cleared refreshToken for user: ${user.email}`);
      }
    }

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      path: '/'
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      path: '/'
    });

    subsegment?.close();
    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error('Error logging out:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi đăng xuất', error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetProfile') : null;
  try {
    console.log(`Fetching profile for userId: ${req.user.userId}`);
    // User and Order models already imported

    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) {
      subsegment?.close(new Error('User not found'));
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const orders = await Order.find({ userId, status: { $in: ['completed', 'delivered'] } });
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0)
    };
    subsegment?.close();
    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        stats
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy thông tin hồ sơ', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - UpdateProfile') : null;
  try {
    console.log(`Updating profile for userId: ${req.user.userId} with data: ${JSON.stringify(req.body)}`);
    // User model already imported

    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      subsegment?.close(new Error('Invalid userId'));
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    const { name, phone, address } = req.body;

    // Validation số điện thoại
    if (phone && !phone.match(/^(\+84|0)\d{9,10}$/)) {
      subsegment?.close(new Error('Invalid phone format'));
      return res.status(400).json({
        message: 'Số điện thoại phải bắt đầu bằng +84 hoặc 0 và có 10-11 chữ số'
      });
    }

    // Validation địa chỉ
    if (address && (!address.district || !address.city)) {
      subsegment?.close(new Error('Missing district or city'));
      return res.status(400).json({ message: 'Quận/huyện và thành phố là bắt buộc' });
    }

    const user = await User.findById(userId);
    if (!user) {
      subsegment?.close(new Error('User not found'));
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.name = name !== undefined ? name.trim() : user.name;
    user.phone = phone !== undefined ? phone.trim() : user.phone;
    if (address) {
      user.address = {
        street: address.street !== undefined ? address.street : user.address.street,
        ward: address.ward !== undefined ? address.ward : user.address.ward,
        district: address.district !== undefined ? address.district : user.address.district,
        city: address.city !== undefined ? address.city : user.address.city,
        zipCode: address.zipCode !== undefined ? address.zipCode : user.address.zipCode
      };
    }

    await user.save({ validateBeforeSave: true });
    subsegment?.close();

    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 3600000,
      path: '/'
    });

    res.status(200).json({
      message: 'Cập nhật profile thành công',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role
      },
      accessToken: newAccessToken
    });
  } catch (err) {
    console.error('Error updating profile:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã tồn tại' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật profile', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetStats') : null;
  try {
    console.log(`Fetching stats for userId: ${req.user.userId}`);
    // Order model already imported

    const orders = await Order.find({ userId: req.user.userId });
    console.log(`Found ${orders.length} orders for userId: ${req.user.userId}`);
    subsegment?.close();
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalPrice, 0)
    };
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching stats:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetUsers') : null;
  try {
    console.log(`Fetching users with query: ${JSON.stringify(req.query)}`);
    // User model already imported

    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('User is not admin'));
      return res.status(403).json({ message: 'Chỉ admin được phép thực hiện' });
    }

    const { page = 1, limit = 10 } = req.query;
    const users = await User.find({})
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('name email phone role address createdAt');
    const totalCount = await User.countDocuments();
    subsegment?.close();
    res.status(200).json({
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching users:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - DeleteUser') : null;
  try {
    console.log(`Deleting user with ID: ${req.params.id}`);
    // User model already imported

    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('User is not admin'));
      return res.status(403).json({ message: 'Chỉ admin được phép thực hiện' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      subsegment?.close(new Error('Invalid user ID'));
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    if (id === req.user.userId.toString()) {
      subsegment?.close(new Error('Cannot delete own account'));
      return res.status(400).json({ message: 'Không thể xóa tài khoản của chính bạn' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      subsegment?.close(new Error('User not found'));
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    console.log(`Deleted user: ${user.email}`);
    subsegment?.close();
    res.status(200).json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    console.error('Error deleting user:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa người dùng', error: err.message });
  }
};

exports.adminUpdateUser = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - AdminUpdateUser') : null;
  try {
    console.log(`Admin updating user ID: ${req.params.id} with data: ${JSON.stringify(req.body)}`);
    // User model already imported

    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('User is not admin'));
      return res.status(403).json({ message: 'Chỉ admin được phép thực hiện' });
    }

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      subsegment?.close(new Error('Invalid user ID'));
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const { name, phone, address, role } = req.body;

    // Validation số điện thoại
    if (phone && !phone.match(/^(\+84|0)\d{9,10}$/)) {
      subsegment?.close(new Error('Invalid phone format'));
      return res.status(400).json({
        message: 'Số điện thoại phải bắt đầu bằng +84 hoặc 0 và có 10-11 chữ số'
      });
    }

    // Validation địa chỉ
    if (address && (!address.district || !address.city)) {
      subsegment?.close(new Error('Missing district or city'));
      return res.status(400).json({ message: 'Quận/huyện và thành phố là bắt buộc' });
    }

    const user = await User.findById(userId);
    if (!user) {
      subsegment?.close(new Error('User not found'));
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.name = name !== undefined ? name.trim() : user.name;
    user.phone = phone !== undefined ? phone.trim() : user.phone;
    if (address) {
      user.address = {
        street: address.street !== undefined ? address.street : user.address.street,
        ward: address.ward !== undefined ? address.ward : user.address.ward,
        district: address.district !== undefined ? address.district : user.address.district,
        city: address.city !== undefined ? address.city : user.address.city,
        zipCode: address.zipCode !== undefined ? address.zipCode : user.address.zipCode
      };
    }
    if (role) user.role = role;

    await user.save({ validateBeforeSave: true });
    subsegment?.close();

    res.status(200).json({
      message: 'Admin cập nhật người dùng thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Error in adminUpdateUser:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã tồn tại' });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi admin cập nhật người dùng', error: err.message });
  }
};