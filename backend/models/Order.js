const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true, minlength: 1 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  }],
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  shippingAddress: {
  street: { type: String, default: '' },
  district: { type: String, default: '' },
  city: { type: String, default: '' }
},
paymentMethod: { type: String, enum: ['cod', 'card', 'bank'], default: 'cod' },
});

orderSchema.pre('save', function(next) {
  this.totalPrice = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  this.updatedAt = Date.now();
  next();
});


orderSchema.index({ userId: 1 });
module.exports = mongoose.model('Order', orderSchema);