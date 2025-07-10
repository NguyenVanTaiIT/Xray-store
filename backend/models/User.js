const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ']
  },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^(\+84|0)\d{9,10}$/, 'Số điện thoại phải bắt đầu bằng +84 hoặc 0 và có 10-11 chữ số']
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  address: {
    street: { type: String, default: '' },
    ward: { type: String, default: '' },
    district: { type: String, required: [true, 'Quận/huyện là bắt buộc'] },
    city: { type: String, required: [true, 'Thành phố là bắt buộc'] },
    zipCode: { type: String, default: '' }
  },
  stats: {
    totalOrders: { type: Number, default: 0, min: [0, 'Tổng đơn hàng không được âm'] },
    totalSpent: { type: Number, default: 0, min: [0, 'Tổng chi tiêu không được âm'] }
  },
  refreshToken: { type: String, default: null }
});

// Middleware băm mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

// Cập nhật updatedAt khi findOneAndUpdate
userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Index để tối ưu tìm kiếm
userSchema.index({ refreshToken: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);