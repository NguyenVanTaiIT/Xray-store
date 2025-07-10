const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: [0, 'Giá không được âm'] },
  image: { 
    type: String, 
    required: true,
    match: [/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp)$/, 'URL ảnh không hợp lệ']
  },
  category: { type: String, enum: ['gaming', 'office', 'ultrabook'], required: true },
  brand: { type: String, enum: ['asus', 'msi', 'acer', 'lenovo'], required: true },
  specs: {
  type: [String],
  validate: {
    validator: function(arr) {
      return Array.isArray(arr) && arr.every(v => typeof v === 'string' && v.trim().length > 0);
    },
    message: 'Thông số kỹ thuật không được rỗng và phải là chuỗi hợp lệ'
  }
},
  rating: { type: Number, default: 0, min: [0, 'Đánh giá không được âm'], max: [5, 'Đánh giá tối đa là 5'] },
  reviews: { type: Number, default: 0, min: [0, 'Số đánh giá không được âm'] },
  reviewsData: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: { type: String, required: true }, // tên người đánh giá
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  stockQuantity: { type: Number, default: 0, min: [0, 'Số lượng tồn kho không được âm'] },
  inStock: { type: Boolean, default: true },
  warranty: { type: String, default: '24 tháng' },
  storage: { type: String, default: '' },
  display: { type: String, default: '' },
  os: { type: String, default: '' },
  battery: { type: String, default: '' },
  weight: { type: String, default: '' },
  featuresDescription: { type: String, default: '' },
  description: { type: String, required: [true, 'Mô tả sản phẩm là bắt buộc'] },
  sku: { 
    type: String, 
    required: [true, 'SKU là bắt buộc'], 
    unique: true,
    match: [/^[A-Z]+-[A-Z]+-\d{4}$/, 'SKU phải có định dạng BRAND-CATEGORY-XXXX (ví dụ: ASUS-GAMING-1234)']
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tự động cập nhật updatedAt và inStock
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.inStock = this.stockQuantity > 0;
  this.updateRating();
  next();
});
productSchema.pre('save', function(next) {
  const sizeInBytes = Buffer.byteLength(JSON.stringify(this));
  if (sizeInBytes > 15 * 1024 * 1024) {
    return next(new Error('Tài liệu vượt quá giới hạn kích thước 15MB'));
  }
  next();
});
// Cập nhật updatedAt và inStock khi findOneAndUpdate
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this._update;
  if (update.stockQuantity !== undefined) {
    this.set({ inStock: update.stockQuantity > 0 });
  }
  this.set({ updatedAt: Date.now() });
  next();
});

productSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

// Index để tối ưu tìm kiếm
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ name: 'text' });
productSchema.index({ stockQuantity: 1 });
productSchema.index({ inStock: 1 });

productSchema.methods.updateRating = function () {
  const total = this.reviewsData.reduce((sum, r) => sum + r.rating, 0);
  this.reviews = this.reviewsData.length;
  this.rating = this.reviews > 0 ? total / this.reviews : 0;
};

module.exports = mongoose.model('Product', productSchema);