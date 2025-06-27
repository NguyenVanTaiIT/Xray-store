const Product = require('../models/Product');

exports.getProducts = async (req, res) => {
  try {
    const { category, brand, sort, page = 1, limit = 10 } = req.query;
    let query = {};

    // Validation category
    const validCategories = ['gaming', 'office', 'ultrabook'];
    if (category && category !== 'all') {
      if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ message: 'Danh mục không hợp lệ' });
      }
      query.category = new RegExp(`^${category}$`, 'i');
    }

    // Validation brand
    const validBrands = ['asus', 'msi', 'acer', 'lenovo'];
    if (brand && brand !== 'all') {
      if (!validBrands.includes(brand.toLowerCase())) {
        return res.status(400).json({ message: 'Thương hiệu không hợp lệ' });
      }
      query.brand = new RegExp(`^${brand}$`, 'i');
    }

    // Xây dựng sort
    let sortOption = {};
    if (sort === 'price-low') {
      sortOption.price = 1;
    } else if (sort === 'price-high') {
      sortOption.price = -1;
    } else if (sort === 'rating') {
      sortOption.rating = -1;
    }

    // Get total count for pagination
    const totalCount = await Product.countDocuments(query);

    // Truy vấn với phân trang
    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({ products, totalCount: totalCount || 0 });
  } catch (err) {
    console.error('Error fetching products:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Dữ liệu đầu vào không hợp lệ' });
    }
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name, price, image, category, brand, specs, stockQuantity, warranty,
      storage, display, os, battery, weight, featuresDescription, description, sku
    } = req.body;

    if (!name || !price || !image || !category || !brand || !sku) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm' });
    }

    if (!/^SKU-[a-f0-9]{24}$/.test(sku)) {
      return res.status(400).json({ message: 'SKU không hợp lệ' });
    }

    if (!/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/.test(image)) {
      return res.status(400).json({ message: 'URL ảnh không hợp lệ' });
    }

    const validCategories = ['gaming', 'office', 'ultrabook'];
    const validBrands = ['asus', 'msi', 'acer', 'lenovo'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: 'Danh mục không hợp lệ' });
    }
    if (!validBrands.includes(brand)) {
      return res.status(400).json({ message: 'Thương hiệu không hợp lệ' });
    }

    if (price < 0 || (stockQuantity !== undefined && stockQuantity < 0)) {
      return res.status(400).json({ message: 'Giá hoặc số lượng tồn kho không hợp lệ' });
    }

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'SKU đã tồn tại' });
    }

    const product = new Product({
      name,
      price,
      image,
      category,
      brand,
      specs: specs || [],
      stockQuantity: stockQuantity || 0,
      warranty: warranty || '24 tháng',
      storage: storage || '',
      display: display || '',
      os: os || '',
      battery: battery || '',
      weight: weight || '',
      featuresDescription: featuresDescription || '',
      description: description || '',
      sku,
      rating: 0,
      reviews: 0,
      inStock: (stockQuantity || 0) > 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'SKU đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi khi tạo sản phẩm' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, price, image, category, brand, specs, stockQuantity, warranty,
      storage, display, os, battery, weight, featuresDescription, description, sku
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (sku && sku !== product.sku) {
      if (!/^SKU-[a-f0-9]{24}$/.test(sku)) {
        return res.status(400).json({ message: 'SKU không hợp lệ' });
      }
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'SKU đã tồn tại' });
      }
    }

    if (image && !/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/.test(image)) {
      return res.status(400).json({ message: 'URL ảnh không hợp lệ' });
    }

    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ message: 'Danh mục không hợp lệ' });
    }
    if (brand && !validBrands.includes(brand)) {
      return res.status(400).json({ message: 'Thương hiệu không hợp lệ' });
    }

    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: 'Giá không hợp lệ' });
    }
    if (stockQuantity !== undefined && stockQuantity < 0) {
      return res.status(400).json({ message: 'Số lượng tồn kho không hợp lệ' });
    }

    product.name = name || product.name;
    product.price = price !== undefined ? price : product.price;
    product.image = image || product.image;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.specs = specs || product.specs;
    product.stockQuantity = stockQuantity !== undefined ? stockQuantity : product.stockQuantity;
    product.warranty = warranty || product.warranty;
    product.storage = storage || product.storage;
    product.display = display || product.display;
    product.os = os || product.os;
    product.battery = battery || product.battery;
    product.weight = weight || product.weight;
    product.featuresDescription = featuresDescription || product.featuresDescription;
    product.description = description || product.description;
    product.sku = sku || product.sku;
    product.inStock = product.stockQuantity > 0;
    product.updatedAt = new Date();

    await product.save();
    res.status(200).json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    res.status(200).json({ message: 'Sản phẩm đã được xóa' });
  } catch (err) {
    console.error('Error deleting product:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm' });
  }
};