const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: {
    type: String,
    required: true,
    match: [/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/, 'URL ảnh không hợp lệ']
  },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  specs: [{ type: String }],
  inStock: { type: Boolean, default: true }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema],
  totalPrice: { type: Number, default: 0, min: 0 }, // Tổng giá trị giỏ hàng
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo
  updatedAt: { type: Date, default: Date.now } // Thời gian cập nhật
});

// Tự động cập nhật updatedAt
cartSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index để tối ưu truy vấn
cartSchema.index({ userId: 1 });
cartSchema.index({ 'items.productId': 1 });

module.exports = mongoose.model('Cart', cartSchema);