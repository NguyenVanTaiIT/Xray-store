const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    let cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
      await cart.save();
    }
    res.status(200).json(cart.items);
  } catch (err) {
    console.error('Error fetching cart:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy giỏ hàng' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    if (product.stockQuantity < (quantity || 1)) {
      return res.status(400).json({ message: 'Số lượng sản phẩm trong kho không đủ' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [], totalPrice: 0 });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: quantity || 1,
        specs: product.specs || [],
        inStock: product.stockQuantity > 0
      });
    }

    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    cart.updatedAt = new Date();
    await cart.save();
    res.status(200).json(cart.items);
  } catch (err) {
    console.error('Error adding to cart:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi thêm vào giỏ hàng' });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    // Find the product to validate stock and get specs
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    if (quantity > product.stockQuantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm trong kho không đủ' });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
    }

    // Find the item in the cart
    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
    }

    // Update item details
    item.quantity = Math.max(1, quantity);
    item.inStock = product.stockQuantity >= quantity;
    item.specs = product.specs || []; // Ensure specs are included
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    cart.updatedAt = new Date();

    // Save the updated cart
    await cart.save();
    res.status(200).json(cart.items);
  } catch (err) {
    console.error('Error updating cart:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật giỏ hàng' });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    cart.updatedAt = new Date();
    await cart.save();
    res.status(200).json(cart.items);
  } catch (err) {
    console.error('Error removing item:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID sản phẩm không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm khỏi giỏ hàng' });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });

    cart.items = [];
    cart.totalPrice = 0;
    cart.updatedAt = new Date();
    await cart.save();
    res.status(200).json([]);
  } catch (err) {
    console.error('Error clearing cart:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa giỏ hàng' });
  }
};