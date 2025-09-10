const AWSXRay = require('aws-xray-sdk');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// S3 client
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

exports.getCart = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetCart') : null;

  try {
    console.log(`Fetching cart for userId: ${userId}, url: ${req.originalUrl}`);
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      subsegment?.close();
      return res.status(200).json({ items: [], totalPrice: 0 });
    }

    const itemsRaw = await Promise.all(cart.items.map(async (item) => {
      const product = await Product.findById(item.productId).lean();
      if (!product) return null;
      return {
        _id: item._id, // Thêm dòng này
        productId: item.productId._id ? item.productId._id.toString() : item.productId.toString(),
        name: item.name || product.name,
        image: item.image || product.image,
        price: item.price || product.price,
        quantity: item.quantity,
        inStock: product.stockQuantity >= item.quantity,
        stockQuantity: product.stockQuantity,
        specs: item.specs || product.specs || []
      };
    }));

    const items = itemsRaw.filter(Boolean);
    res.status(200).json({ items, totalPrice: cart.totalPrice });
  } catch (err) {
    console.error('Error fetching cart:', {
      message: err.message,
      stack: err.stack,
      userId,
      url: req.originalUrl
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng', error: err.message });
  }
};


exports.addToCart = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - AddToCart') : null;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity } = req.body;
    console.log(`Adding to cart for userId: ${userId}, productId: ${productId}, quantity: ${quantity}, url: ${req.originalUrl}`);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      subsegment?.close(new Error('Invalid product ID'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      subsegment?.close(new Error('Invalid quantity'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Số lượng phải là số nguyên dương' });
    }

    const product = await Product.findById(productId).session(session).lean();
    if (!product) {
      subsegment?.close(new Error('Product not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (product.stockQuantity < quantity) {
      subsegment?.close(new Error('Insufficient stock'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Số lượng yêu cầu (${quantity}) vượt quá tồn kho (${product.stockQuantity})` });
    }

    let cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    const existingItem = cart.items.find(item => String(item.productId) === productId);
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stockQuantity) {
        subsegment?.close(new Error('Insufficient stock'));
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Số lượng vượt quá tồn kho (${product.stockQuantity})` });
      }
      existingItem.quantity = newQuantity;
      existingItem.inStock = product.stockQuantity >= newQuantity;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
        inStock: product.stockQuantity >= quantity,
        specs: product.specs || []
      });
    }

    cart.totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
    await Product.findByIdAndUpdate(
      productId,
      {
        stockQuantity: product.stockQuantity - quantity,
        inStock: product.stockQuantity - quantity > 0
      },
      { session }
    );
    await cart.save({ session });
    await cart.populate('items.productId');
    await session.commitTransaction();
    session.endSession();

    const items = cart.items.map(item => ({
      productId: item.productId._id.toString(),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      inStock: item.inStock,
      specs: item.specs
    }));

    console.log(`Cart updated with ${items.length} items, totalPrice: ${cart.totalPrice}`);
    subsegment?.close();
    res.status(200).json({ items, totalPrice: cart.totalPrice });
  } catch (err) {
    console.error('Error adding to cart:', {
      message: err.message,
      stack: err.stack,
      userId,
      url: req.originalUrl
    });
    await session.abortTransaction();
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Dữ liệu trùng lặp' });
    }
    res.status(500).json({ message: 'Lỗi khi thêm sản phẩm vào giỏ hàng', error: err.message });
  }
};


exports.updateCartItem = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - UpdateCartItem') : null;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;
    console.log(`Updating cart item for userId: ${userId}, productId: ${productId}, quantity: ${quantity}, url: ${req.originalUrl}`);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      subsegment?.close(new Error('Invalid product ID'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      subsegment?.close(new Error('Invalid quantity'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Số lượng phải là số nguyên dương' });
    }

    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      subsegment?.close(new Error('Cart not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }
    const item = cart.items.find(item => String(item.productId) === productId);
    if (!item) {
      subsegment?.close(new Error('Item not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      subsegment?.close(new Error('Product not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    if (quantity > product.stockQuantity + item.quantity) {
      subsegment?.close(new Error('Insufficient stock'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `Chỉ còn ${product.stockQuantity} sản phẩm trong kho` });
    }

    const stockAdjustment = item.quantity - quantity; // Positive if reducing quantity, negative if increasing
    item.quantity = quantity;
    item.inStock = product.stockQuantity + stockAdjustment >= quantity;
    cart.totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
    await Product.findByIdAndUpdate(
      productId,
      { stockQuantity: product.stockQuantity + stockAdjustment, inStock: product.stockQuantity + stockAdjustment > 0 },
      { session }
    );
    await cart.save({ session });
    await cart.populate('items.productId');
    await session.commitTransaction();
    session.endSession();

    const items = cart.items.map(item => ({
      productId: item.productId._id.toString(),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      inStock: item.inStock,
      specs: item.specs
    }));
    console.log(`Cart item updated, totalPrice: ${cart.totalPrice}`);
    subsegment?.close();
    res.status(200).json({ items, totalPrice: cart.totalPrice });
  } catch (err) {
    console.error('Error updating cart:', { message: err.message, stack: err.stack, userId, url: req.originalUrl });
    await session.abortTransaction();
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Dữ liệu trùng lặp' });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật giỏ hàng', error: err.message });
  }
};

exports.removeCartItem = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - RemoveCartItem') : null;
  const session = await mongoose.startSession();
  session.startTransaction();
  const userId = req.user.userId; // <-- Đã thêm dòng này
  try {
    const { itemId } = req.params;
    console.log(`Removing cart item for userId: ${userId}, itemId: ${itemId}, url: ${req.originalUrl}`);

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      subsegment?.close(new Error('Invalid product ID'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }

    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      subsegment?.close(new Error('Cart not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    const itemIndex = cart.items.findIndex(item => String(item._id) === itemId);
    if (itemIndex === -1) {
      subsegment?.close(new Error('Item not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    const item = cart.items[itemIndex];
    await Product.findByIdAndUpdate(
      item.productId,
      {
        $inc: { stockQuantity: item.quantity },
        inStock: true // hoặc tự động set lại sau khi cập nhật stockQuantity nếu cần
      },
      { session }
    );
    cart.items.splice(itemIndex, 1);
    cart.totalPrice = cart.items.reduce((total, item) => total + item.quantity * item.price, 0);
    await cart.save({ session });
    await cart.populate('items.productId');
    await session.commitTransaction();
    session.endSession();

    const items = cart.items.map(item => ({
      productId: item.productId._id.toString(),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      inStock: item.inStock,
      specs: item.specs
    }));
    console.log(`Cart item removed, totalPrice: ${cart.totalPrice}`);
    subsegment?.close();
    res.status(200).json({ items, totalPrice: cart.totalPrice });
  } catch (err) {
    console.error('Error removing cart item:', { message: err.message, stack: err.stack, userId, url: req.originalUrl });
    await session.abortTransaction();
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Dữ liệu trùng lặp' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng', error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - ClearCart') : null;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.userId;
    console.log(`Clearing cart for userId: ${userId}, url: ${req.originalUrl}`);

    let cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stockQuantity: item.quantity },
          inStock: true // hoặc tự động set lại sau khi cập nhật stockQuantity nếu cần
        },
        { session }
      );
    }
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });
    await session.commitTransaction();
    session.endSession();

    console.log(`Cart cleared for userId: ${userId}`);
    subsegment?.close();
    res.status(200).json({ items: [], totalPrice: 0 });
  } catch (err) {
    console.error('Error clearing cart:', { message: err.message, stack: err.stack, userId, url: req.originalUrl });
    await session.abortTransaction();
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Dữ liệu trùng lặp' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa giỏ hàng', error: err.message });
  }
};

exports.uploadCartItemImage = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('S3 Upload - CartItem') : null;
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      subsegment?.close(new Error('Invalid product ID'));
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }

    const params = {
      Bucket: 'ecommerce-products-2025',
      Key: `cart/${userId}/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(params));
    subsegment?.close();
    res.status(200).json({ imageUrl: `https://ecommerce-products-2025.s3.ap-southeast-1.amazonaws.com/${params.Key}` });
  } catch (err) {
    console.error('Error uploading cart item image:', { message: err.message, stack: err.stack });
    subsegment?.close(err);
    res.status(500).json({ message: 'Lỗi khi upload ảnh', error: err.message });
  }
};