const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }, // Validation giá không âm
  image: { 
    type: String, 
    required: true,
    match: [/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/, 'URL ảnh không hợp lệ'] // Validation URL ảnh
  },
  category: { type: String, enum: ['gaming', 'office', 'ultrabook'], required: true },
  brand: { type: String, enum: ['asus', 'msi', 'acer', 'lenovo'], required: true },
  specs: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 }, // Số lượng tồn kho
  inStock: { type: Boolean, default: true }, // Tính từ stockQuantity
  warranty: { type: String, default: '24 tháng' },
  storage: { type: String },
  display: { type: String },
  os: { type: String },
  battery: { type: String },
  weight: { type: String },
  featuresDescription: { type: String },
  description: { type: String },
  sku: { 
  type: String, 
  required: true, 
  unique: true,
  match: [/^SKU-[a-f0-9]{24}$/, 'SKU không hợp lệ'] // Ví dụ định dạng SKU
},
  createdAt: { type: Date, default: Date.now }, // Thời gian tạo
  updatedAt: { type: Date, default: Date.now } // Thời gian cập nhật
});

// Tự động cập nhật updatedAt và inStock
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.inStock = this.stockQuantity > 0;
  next();
});


// Index để tối ưu tìm kiếm
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);