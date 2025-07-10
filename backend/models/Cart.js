const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, trim: true },
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
  totalPrice: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Kiểm tra productId tồn tại trước khi validate
cartSchema.pre('validate', async function(next) {
  try {
    for (const item of this.items) {
      const product = await mongoose.model('Product').findById(item.productId);
      if (!product) {
        return next(new Error(`Sản phẩm không tồn tại: ${item.productId}`));
      }
      item.inStock = product.stockQuantity >= item.quantity;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Tính và kiểm tra totalPrice trước khi lưu
cartSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  this.updatedAt = Date.now();
  next();
});

// Cập nhật updatedAt khi findOneAndUpdate
cartSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Index để tối ưu truy vấn
cartSchema.index({ userId: 1 });
cartSchema.index({ 'items.productId': 1 });
cartSchema.index({ 'items.inStock': 1 });

module.exports = mongoose.model('Cart', cartSchema);