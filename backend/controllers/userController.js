const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');

// Kiểm tra biến môi trường
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables');
}

exports.register = async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { email, password, name, phone } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!email || !password || !name || !phone) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email, mật khẩu, tên và số điện thoại' });
    }

    // Validate định dạng phone
    if (!/^0\d{9}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số' });
    }

    // Kiểm tra email hoặc phone đã tồn tại
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã tồn tại' });
    }

    // Validate mật khẩu
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/)) {
      return res.status(400).json({
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự, 1 chữ hoa, 1 chữ thường và 1 số',
      });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const user = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      address: { street: '', district: '', city: '', zipCode: '' },
      role: 'user'
    });

    await user.save();

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { id: user._id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      accessToken,
    });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi khi đăng ký' });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('1. Payload received by login function:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('2. Email or password missing, returning 400.');
      return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    console.log('3. Searching for user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('4. User not found, returning 401.');
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('5. Password does not match, returning 401.');
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    console.log('6. Login successful. Generating tokens.');
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Lưu refreshToken vào database
    user.refreshToken = refreshToken;
    await user.save();

    // Lưu tokens vào cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: false, // Đặt false để JavaScript đọc được cookie
      secure: false, // Tạm thời đặt false để test trên localhost
      sameSite: 'Lax',
      maxAge: 3600000, // 1 giờ
      path: '/'
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Giữ httpOnly cho refreshToken để tăng bảo mật
      secure: false,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/'
    });

    console.log('7. Cookies set:', { accessToken, refreshToken });
    console.log('8. Response sent:', {
      user: { id: user._id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      accessToken
    });

    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: { id: user._id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      accessToken
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Lỗi khi đăng nhập' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      console.log('No refresh token provided');
      return res.status(401).json({ message: 'Không tìm thấy refresh token' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    console.log('User found:', user ? user._id : 'No user');

    if (!user || user.refreshToken !== refreshToken) {
      console.log('Invalid refresh token or user mismatch');
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
      maxAge: 3600000
    });

    res.status(200).json({ message: 'Refresh token thành công' });
  } catch (err) {
    console.error('Error refreshing token:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Refresh token không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    // Xóa cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/'
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    });

    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (err) {
    console.error('Error logging out:', err);
    res.status(500).json({ message: 'Lỗi khi đăng xuất' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy thông tin profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, address } = req.body;
    console.log('Update profile payload:', JSON.stringify({ name, address }, null, 2));
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Tên không được để trống' });
    }
    if (address && (!address.street && !address.district && !address.city && !address.zipCode)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một thông tin địa chỉ' });
    }

    user.name = name || user.name;
    if (address) {
      user.address = {
        street: address.street !== undefined ? address.street : user.address.street || '',
        district: address.district !== undefined ? address.district : user.address.district || '',
        city: address.city !== undefined ? address.city : user.address.city || '',
        zipCode: address.zipCode !== undefined ? address.zipCode : user.address.zipCode || ''
      };
    }

    await user.save({ validateBeforeSave: true });
    console.log('Updated user address:', JSON.stringify(user.address, null, 2));

    res.status(200).json({
      message: 'Cập nhật profile thành công',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật profile' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId });
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalPrice, 0)
    };
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê' });
  }
};