const Order = require('../models/Order');
const Cart = require('../models/Cart');

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    const items = cart.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      quantity: item.quantity
    }));

    const totalPrice = cart.totalPrice;

    const order = new Order({
      userId,
      items,
      totalPrice,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await order.save();

    // Xóa giỏ hàng sau khi tạo đơn hàng
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.productId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, userId: req.user.userId },
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }
    res.status(200).json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng' });
  }
};