const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Product = require('../models/Product');
const User = require('../models/User');

// Sử dụng biến môi trường
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Xray-laptop';

const products = [
  {
    name: 'ASUS ROG Strix G15',
    price: 32990000,
    image: 'https://via.placeholder.com/600x400.png',
    category: 'gaming',
    brand: 'asus',
    specs: ['RTX 4060', 'AMD Ryzen 7', '16GB RAM'],
    rating: 4.5,
    reviews: 120,
    stockQuantity: 10, // Thêm stockQuantity để tính inStock
    warranty: '24 tháng',
    storage: '1TB SSD NVMe',
    display: '15.6" FHD 144Hz IPS',
    os: 'Windows 11',
    battery: '90Wh',
    weight: '2.5kg',
    featuresDescription: 'Thiết kế gaming mạnh mẽ với đèn RGB và tản nhiệt tiên tiến ROG Intelligent Cooling.',
    description: 'ASUS ROG Strix G15 là laptop gaming mạnh mẽ với RTX 4060 và AMD Ryzen 7, mang lại trải nghiệm chơi game mượt mà.',
    sku: 'SKU-' + require('crypto').randomBytes(12).toString('hex'), // Tạo SKU ngẫu nhiên
  },
  {
    name: 'MSI Katana 17',
    price: 27990000,
    image: 'https://via.placeholder.com/600x400.jpg',
    category: 'gaming',
    brand: 'msi',
    specs: ['RTX 3050', 'Intel i5-12450H', '8GB RAM'],
    rating: 4.2,
    reviews: 85,
    stockQuantity: 15,
    warranty: '24 tháng',
    storage: '512GB SSD',
    display: '17.3" FHD 144Hz',
    os: 'Windows 11',
    battery: '65Wh',
    weight: '2.8kg',
    featuresDescription: 'Hiệu năng mạnh mẽ với thiết kế tản nhiệt tối ưu, phù hợp cho các tựa game phổ biến.',
    description: 'MSI Katana 17 phù hợp cho game thủ với hiệu năng ổn định và màn hình lớn cho trải nghiệm đắm chìm.',
    sku: 'SKU-' + require('crypto').randomBytes(12).toString('hex'),
  },
  {
    name: 'Acer Nitro 5',
    price: 25000000,
    image: 'https://via.placeholder.com/600x400.jpeg',
    category: 'gaming',
    brand: 'acer',
    specs: ['RTX 3060', 'Intel i7-11800H', '16GB RAM'],
    rating: 4.3,
    reviews: 150,
    stockQuantity: 20,
    warranty: '12 tháng',
    storage: '1TB SSD',
    display: '15.6" FHD 144Hz',
    os: 'Windows 11',
    battery: '57.5Wh',
    weight: '2.3kg',
    featuresDescription: 'Thiết kế hầm hố, tản nhiệt tốt, hiệu năng cao cho gaming và các tác vụ nặng.',
    description: 'Acer Nitro 5 là lựa chọn tốt cho game thủ với RTX 3060, mang lại hiệu suất chơi game vượt trội.',
    sku: 'SKU-' + require('crypto').randomBytes(12).toString('hex'),
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon Gen 10',
    price: 38000000,
    image: 'https://via.placeholder.com/600x400.png',
    category: 'office',
    brand: 'lenovo',
    specs: ['Intel Iris Xe', 'Intel i7-1260P', '16GB RAM'],
    rating: 4.7,
    reviews: 90,
    stockQuantity: 8,
    warranty: '24 tháng',
    storage: '512GB SSD NVMe',
    display: '14" WUXGA IPS',
    os: 'Windows 11 Pro',
    battery: '57Wh',
    weight: '1.13kg',
    featuresDescription: 'Thiết kế siêu mỏng nhẹ, bền bỉ, bảo mật cao, lý tưởng cho doanh nhân.',
    description: 'Lenovo ThinkPad X1 Carbon Gen 10 là laptop doanh nhân cao cấp, bền bỉ và hiệu quả cho công việc.',
    sku: 'SKU-' + require('crypto').randomBytes(12).toString('hex'),
  },
  {
    name: 'ASUS ZenBook 14 OLED',
    price: 28000000,
    image: 'https://via.placeholder.com/600x400.jpg',
    category: 'ultrabook',
    brand: 'asus',
    specs: ['Intel Iris Xe', 'Intel i5-1240P', '8GB RAM'],
    rating: 4.6,
    reviews: 75,
    stockQuantity: 12,
    warranty: '12 tháng',
    storage: '512GB SSD NVMe',
    display: '14" 2.8K OLED',
    os: 'Windows 11 Home',
    battery: '75Wh',
    weight: '1.39kg',
    featuresDescription: 'Màn hình OLED tuyệt đẹp, thiết kế mỏng nhẹ, pin cả ngày.',
    description: 'ASUS ZenBook 14 OLED là ultrabook thanh lịch với màn hình OLED rực rỡ và hiệu suất tốt cho công việc hàng ngày.',
    sku: 'SKU-' + require('crypto').randomBytes(12).toString('hex'),
  },
];

const users = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    phone: '0901234567',
    address: { street: '123 Đường ABC', district: 'Quận 1', city: 'TP.HCM' },
    avatar: 'https://via.placeholder.com/150.png',
    role: 'admin',
  },
  {
    email: 'user@example.com',
    password: 'user123',
    name: 'Normal User',
    phone: '0912345678',
    address: { street: '456 Đường XYZ', district: 'Quận 2', city: 'TP.HCM' },
    avatar: 'https://via.placeholder.com/150.jpg',
    role: 'user',
  },
];

async function initDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Đã kết nối tới MongoDB');

    // Xóa dữ liệu cũ
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');

    // Thêm dữ liệu sản phẩm
    await Product.insertMany(products.map(product => ({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    })));
    console.log('Đã thêm dữ liệu sản phẩm');

    // Thêm dữ liệu người dùng
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    await User.insertMany(hashedUsers);
    console.log('Đã thêm dữ liệu người dùng');

    console.log('Khởi tạo cơ sở dữ liệu thành công!');
  } catch (err) {
    console.error('Lỗi khi khởi tạo cơ sở dữ liệu:', err);
    if (err.name === 'ValidationError') {
      console.error('Validation Error:', Object.values(err.errors).map(e => e.message).join(', '));
    }
  } finally {
    // Không đóng kết nối, để server sử dụng
    // await mongoose.connection.close(); // Bỏ dòng này nếu tích hợp với server.js
  }
}

initDB();