const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const { getCart, addToCart, uploadCartItemImage, removeCartItem, updateCartItem, clearCart } = require('../controllers/cartController');
const upload = multer({ dest: 'uploads/' });

// Middleware kiểm tra ObjectId hợp lệ
const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `ID ${paramName} không hợp lệ` });
  }
  next();
};


  // Middleware logging
  router.use((req, res, next) => {
    const userId = req.user ? req.user.userId : 'unauthenticated';
    console.log(`Cart route hit: ${req.method} ${req.originalUrl} by userId: ${userId} at ${new Date().toISOString()}`);
    next();
  });

  // Routes
  router.get('/', authMiddleware, getCart);
  router.post('/', authMiddleware, addToCart);
  router.post('/:productId/image', authMiddleware, upload.single('image'), uploadCartItemImage);
  router.delete('/:productId', authMiddleware, validateObjectId('productId'), removeCartItem);
  router.put('/:productId', authMiddleware, validateObjectId('productId'), updateCartItem);
  router.delete('/', authMiddleware, clearCart);

module.exports = router;