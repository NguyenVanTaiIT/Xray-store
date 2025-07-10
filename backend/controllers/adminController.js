const AWSXRay = require('aws-xray-sdk');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

exports.getDashboardStats = async (req, res) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment ? segment.addNewSubsegment('MongoDB Query - GetDashboardStats') : null;
  try {
    const userId = req.user.userId;
    console.log(`Fetching dashboard stats for admin: ${userId}`);
    
    if (req.user.role !== 'admin') {
      subsegment?.close(new Error('Access denied'));
      return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập thống kê' });
    }

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalUsers = await User.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    const stats = {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      pendingOrders
    };

    console.log(`Dashboard stats fetched: ${JSON.stringify(stats)}`);
    subsegment?.close();
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching dashboard stats:', {
      message: err.message,
      stack: err.stack,
      userId,
      url: req.originalUrl
    });
    subsegment?.close(err);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: err.message });
  }
};