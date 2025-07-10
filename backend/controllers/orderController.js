const AWSXRay = require('aws-xray-sdk');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

exports.createOrder = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - CreateOrder') : null;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`Creating order for userId: ${req.user.userId}`);
    const userId = req.user.userId;
    const { items, name, totalPrice, shippingAddress, paymentMethod } = req.body;

    // Validation userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      subsegment?.close(new Error('Invalid user ID'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    // Validation items
    if (!items || !Array.isArray(items) || items.length === 0) {
      subsegment?.close(new Error('Invalid items data'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Dữ liệu giỏ hàng không hợp lệ' });
    }

    // Validation mỗi item
    for (const item of items) {
      if (
        !mongoose.Types.ObjectId.isValid(item.productId) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 ||
        !item.name || typeof item.name !== 'string' || item.name.trim().length === 0 ||
        typeof item.price !== 'number' || item.price < 0 ||
        !item.image || !/^https?:\/\/.*\.(png|jpg|jpeg|gif)$/.test(item.image) ||
        (item.specs && !Array.isArray(item.specs))
      ) {
        subsegment?.close(new Error('Invalid item data'));
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ (thiếu hoặc sai kiểu productId, quantity, name, price, image, hoặc specs)' });
      }
    }

    // Validation shippingAddress
    if (!shippingAddress || !shippingAddress.district || !shippingAddress.city) {
      subsegment?.close(new Error('Missing district or city'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Quận/huyện và thành phố là bắt buộc' });
    }

    // Validation paymentMethod
    const allowedPaymentMethods = ['cod', 'bank'];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
      subsegment?.close(new Error('Invalid payment method'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Phương thức thanh toán không hợp lệ, chỉ chấp nhận: cod, bank' });
    }

    // Kiểm tra giỏ hàng
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) {
      subsegment?.close(new Error('Cart is empty'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Giỏ hàng rỗng hoặc không tồn tại' });
    }

    // Kiểm tra items khớp với cart
    const cartItemsMap = new Map(cart.items.map(item => [String(item.productId), item]));
    for (const item of items) {
      const cartItem = cartItemsMap.get(String(item.productId));
      if (!cartItem || cartItem.quantity !== item.quantity || cartItem.price !== item.price) {
        subsegment?.close(new Error('Items do not match cart'));
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Sản phẩm ${item.name} không khớp với giỏ hàng` });
      }
    }

    // Kiểm tra tồn kho và cập nhật
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    for (const item of items) {
      const product = products.find(p => String(p._id) === String(item.productId));
      if (!product) {
        subsegment?.close(new Error(`Product not found: ${item.productId}`));
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Sản phẩm ${item.name} không tồn tại` });
      }
      if (product.stockQuantity < item.quantity) {
        subsegment?.close(new Error(`Insufficient stock for product: ${product.name}`));
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Số lượng sản phẩm ${product.name} không đủ trong kho (${product.stockQuantity})` });
      }
    }

    // Cập nhật stockQuantity (KHÔNG cập nhật inStock ở đây)
    const updates = items.map(item => ({
      updateOne: {
        filter: { _id: item.productId },
        update: {
          $inc: { stockQuantity: -item.quantity }
        }
      }
    }));
    await Product.bulkWrite(updates, { session });

    // Cập nhật inStock trong transaction
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        product.inStock = product.stockQuantity > 0;
        await product.save({ session });
      }
    }

    // Tính totalPrice
    const calculatedTotalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);
    if (totalPrice !== calculatedTotalPrice) {
      subsegment?.close(new Error('Total price mismatch'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Tổng giá không khớp với giá trị tính toán' });
    }

    // Tạo đơn hàng
    const order = new Order({
      userId,
      name: name || cart.name || 'Đơn hàng từ giỏ hàng',
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        specs: item.specs || []
      })),
      totalPrice: calculatedTotalPrice,
      status: 'pending',
      shippingAddress: {
        street: shippingAddress.street || '',
        ward: shippingAddress.ward || '',
        district: shippingAddress.district,
        city: shippingAddress.city,
        zipCode: shippingAddress.zipCode || ''
      },
      paymentMethod
    });

    await order.save({ session });

    // Cập nhật thống kê user nếu đơn hàng hoàn thành
    if (order.status === 'completed') {
      await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            'stats.totalOrders': 1,
            'stats.totalSpent': calculatedTotalPrice
          }
        },
        { session }
      );
    }

    // Reset giỏ hàng
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Populate order để trả về dữ liệu đầy đủ
    const populatedOrder = await Order.findById(order._id).select('-userId').populate('items.productId');
    console.log(`Order created successfully: ${order._id}, items: ${items.length}, totalPrice: ${order.totalPrice}`);
    subsegment?.close();
    res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      order: {
        id: populatedOrder._id,
        name: populatedOrder.name,
        items: populatedOrder.items,
        totalPrice: populatedOrder.totalPrice,
        status: populatedOrder.status,
        shippingAddress: populatedOrder.shippingAddress,
        paymentMethod: populatedOrder.paymentMethod,
        createdAt: populatedOrder.createdAt
      }
    });
  } catch (err) {
    console.error('Error creating order:', {
      message: err.message,
      stack: err.stack
    });
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Dữ liệu trùng lặp' });
    }
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetOrders') : null;
  try {
    console.log(`Fetching all orders for admin, page: ${req.query.page}, limit: ${req.query.limit}`);
    const { page = 1, limit = 10 } = req.query;
    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('Access denied'));
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xem tất cả đơn hàng' });
    }
    const orders = await Order.find({})
      .select('-userId')
      .populate('items.productId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalCount = await Order.countDocuments({});

    subsegment?.close();
    res.status(200).json({
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - UpdateOrderStatus') : null;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    console.log(`Updating order status for orderId: ${req.params.orderId}`);
    const { orderId } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      subsegment?.close(new Error('Invalid status'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('Access denied'));
      if (session.inTransaction()) await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Chỉ admin mới có quyền cập nhật trạng thái đơn hàng' });
    }
    const order = await Order.findById(orderId).populate('items.productId'); // giữ nguyên userId
    if (!order) {
      subsegment?.close(new Error('Order not found'));
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Thêm log kiểm tra quyền truy cập
    console.log('req.user.userId:', req.user.userId);
    console.log('order.userId:', order.userId?.toString());

    if (order.status !== 'completed' && order.status !== 'delivered' && (status === 'completed' || status === 'delivered')) {
      await User.findByIdAndUpdate(
        order.userId,
        {
          $inc: {
            'stats.totalOrders': 1,
            'stats.totalSpent': order.totalPrice
          }
        },
        { session }
      );
    } else if ((order.status === 'completed' || order.status === 'delivered') && !['completed', 'delivered'].includes(status)) {
      await User.findByIdAndUpdate(
        order.userId,
        {
          $inc: {
            'stats.totalOrders': -1,
            'stats.totalSpent': -order.totalPrice
          }
        },
        { session }
      );
    }
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true, session }
    ).select('-userId');
    await session.commitTransaction();
    session.endSession();
    subsegment?.close();
    console.log(`Order ${orderId} updated to status: ${status}`);
    res.status(200).json({ order: updatedOrder });
  } catch (err) {
    console.error('Error updating order status:', err);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng', error: err.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetOrdersByUser') : null;
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log(`Fetching orders for userId: ${userId}, page: ${page}, limit: ${limit}`);

    // Kiểm tra userId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      subsegment?.close(new Error('Invalid user ID'));
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && userId !== req.user.userId) {
      subsegment?.close(new Error('Access denied'));
      return res.status(403).json({ message: 'Không có quyền xem đơn hàng của người dùng khác' });
    }

    // Truy vấn đơn hàng với phân trang
    const orders = await Order.find({ userId })
      .select('-userId')
      .populate('items.productId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Đếm tổng số đơn hàng
    const totalCount = await Order.countDocuments({ userId });

    // Kiểm tra rỗng
    if (!orders || orders.length === 0) {
      subsegment?.close();
      return res.status(200).json({
        orders: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: parseInt(page)
      });
    }

    console.log(`Fetched ${orders.length} orders for userId: ${userId}`);
    subsegment?.close();
    res.status(200).json({
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching orders by user:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng người dùng', error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetOrderById') : null;
  try {
    console.log(`Fetching order with ID: ${req.params.orderId}`);
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      subsegment?.close(new Error('Invalid order ID'));
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      subsegment?.close(new Error('Order not found'));
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = order.userId?.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
      subsegment?.close(new Error('Access denied'));
      return res.status(403).json({ message: 'Không có quyền xem đơn hàng này' });
    }

    subsegment?.close();
    console.log(`Order ${orderId} fetched successfully`);
    res.status(200).json(order);
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết đơn hàng', error: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetMyOrders') : null;
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    console.log(`Fetching orders for current user: ${userId}, page: ${page}, limit: ${limit}`);

    // Truy vấn đơn hàng với phân trang
    const orders = await Order.find({ userId })
      .select('-userId')
      .populate('items.productId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Đếm tổng số đơn hàng
    const totalCount = await Order.countDocuments({ userId });

    // Kiểm tra rỗng
    if (!orders || orders.length === 0) {
      subsegment?.close();
      return res.status(200).json({
        orders: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: parseInt(page)
      });
    }

    console.log(`Fetched ${orders.length} orders for userId: ${userId}`);
    subsegment?.close();
    res.status(200).json({
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error('Error fetching orders:', {
      message: err.message,
      stack: err.stack
    });
    subsegment?.close(err);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - DeleteOrder') : null;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    console.log(`Deleting order with ID: ${orderId}`);

    // Kiểm tra orderId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      subsegment?.close(new Error('Invalid order ID'));
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }

    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('Access denied'));
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Chỉ admin mới có quyền xóa đơn hàng' });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      subsegment?.close(new Error('Order not found'));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Khôi phục stockQuantity
    const updates = order.items.map(item => ({
      updateOne: {
        filter: { _id: item.productId },
        update: {
          $inc: { stockQuantity: item.quantity }
          // ❌ Đã bỏ $set: { inStock: ... }
        }
      }
    }));
    await Product.bulkWrite(updates, { session });

    // Xóa đơn hàng
    await Order.findByIdAndDelete(orderId).session(session);

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // ✅ Cập nhật lại inStock sau transaction
    await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (product) {
          product.inStock = product.stockQuantity > 0;
          await product.save();
        }
      })
    );

    console.log(`Order ${orderId} deleted successfully`);
    subsegment?.close();
    res.status(200).json({ message: 'Xóa đơn hàng thành công' });
  } catch (err) {
    console.error('Error deleting order:', {
      message: err.message,
      stack: err.stack
    });
    await session.abortTransaction();
    session.endSession();
    subsegment?.close(err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    res.status(500).json({ message: 'Lỗi khi xóa đơn hàng', error: err.message });
  }
};

exports.getOrdersUnified = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment?.addNewSubsegment('MongoDB Query - GetOrdersUnified');
  try {
    const { userId: paramUserId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const isAdmin = req.user.role === 'admin';
    const targetUserId = paramUserId || req.user.userId;

    // Kiểm tra quyền truy cập
    if (!isAdmin && paramUserId && paramUserId !== req.user.userId) {
      return res.status(403).json({ message: 'Không có quyền truy cập đơn hàng người khác' });
    }

    // Kiểm tra userId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }

    const orders = await Order.find({ userId: targetUserId })
      .select('-userId')
      .populate('items.productId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalCount = await Order.countDocuments({ userId: targetUserId });

    res.status(200).json({
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });

    subsegment?.close();
  } catch (err) {
    console.error('Error in getOrdersUnified:', err);
    subsegment?.close(err);
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng', error: err.message });
  }
};