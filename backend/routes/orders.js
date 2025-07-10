const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware, checkAdmin } = require('../middleware/authMiddleware');
const { getOrdersUnified, getOrders, createOrder, getOrderById, updateOrderStatus, deleteOrder } = require('../controllers/orderController');
// Middleware kiểm tra ObjectId hợp lệ
const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `ID ${paramName} không hợp lệ` });
  }
  next();
};


  // Middleware logging cho tất cả routes
  router.use((req, res, next) => {
    const userId = req.user ? req.user.userId : 'unauthenticated';
    console.log(`Order route hit: ${req.method} ${req.originalUrl} by userId: ${userId} at ${new Date().toISOString()}`);
    next();
  });

  // Routes
  router.get('/my-orders', authMiddleware, getOrdersUnified);
  router.get('/', authMiddleware, checkAdmin, getOrders);
  router.post('/', authMiddleware, createOrder);
  router.get('/user/:userId', authMiddleware, checkAdmin, validateObjectId('userId'), getOrdersUnified);
  router.get('/:orderId', authMiddleware, validateObjectId('orderId'), getOrderById);
  router.put('/:orderId', authMiddleware, checkAdmin, validateObjectId('orderId'), updateOrderStatus);
  router.delete('/:orderId', authMiddleware, checkAdmin, validateObjectId('orderId'), deleteOrder);

module.exports = router;