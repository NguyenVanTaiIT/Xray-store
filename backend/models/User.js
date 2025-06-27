const mongoose = require('mongoose');

   const userSchema = new mongoose.Schema({
     email: { 
       type: String, 
       required: true, 
       unique: true, 
       lowercase: true,
       index: true // Tối ưu tìm kiếm theo email
     },
     password: { type: String, required: true },
     name: { type: String, required: true },
     phone: { 
       type: String, 
       required: true, 
       unique: true,
       match: [/^0\d{9}$/, 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số'] // Validation cho số VN
     },
     role: { type: String, enum: ['user', 'admin'], default: 'user' },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
     address: {
       street: { type: String, default: '' },
       district: { type: String, default: '' },
       city: { type: String, default: '' },
       zipCode: { type: String, default: '' }
     },
     refreshToken: { type: String, default: null },
   });

   // Tự động cập nhật updatedAt khi lưu
   userSchema.pre('save', function(next) {
     this.updatedAt = Date.now();
     next();
   });

   module.exports = mongoose.model('User', userSchema);