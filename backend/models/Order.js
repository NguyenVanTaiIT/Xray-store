const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true, minlength: 1 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  }],
  totalPrice: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending',
    required: true 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  shippingAddress: {
    street: { type: String, default: '' },
    ward: { type: String, default: '' },
    district: { type: String, required: [true, 'Quận/huyện là bắt buộc'] },
    city: { type: String, required: [true, 'Thành phố là bắt buộc'] },
    zipCode: { type: String, default: '' }
  },
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'bank'], 
    default: 'cod',
    required: true 
  }
});

// Kiểm tra productId tồn tại trước khi validate
orderSchema.pre('validate', async function(next) {
  try {
    for (const item of this.items) {
      const product = await mongoose.model('Product').findById(item.productId);
      if (!product) {
        return next(new Error(`Sản phẩm không tồn tại: ${item.productId}`));
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Tính và kiểm tra totalPrice trước khi lưu
orderSchema.pre('save', function(next) {
  const calculatedTotal = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  if (this.totalPrice !== calculatedTotal) {
    return next(new Error('totalPrice không khớp với tổng giá trị các sản phẩm'));
  }
  this.updatedAt = Date.now();
  next();
});

// Cập nhật updatedAt khi findOneAndUpdate
orderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Index để tối ưu truy vấn
orderSchema.index({ userId: 1, createdAt: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);