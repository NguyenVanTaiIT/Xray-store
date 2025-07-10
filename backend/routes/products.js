const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware, checkAdmin, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview, uploadProductImage, searchProducts } = require('../controllers/productController');
const upload = multer();

// Middleware kiểm tra ObjectId hợp lệ
const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: `ID ${paramName} không hợp lệ` });
  }
  next();
};



  router.use(optionalAuthMiddleware); 

  // Middleware logging
  router.use((req, res, next) => {
    const userId = req.user ? req.user.userId : 'unauthenticated';
    console.log(`Product route hit: ${req.method} ${req.originalUrl} by userId: ${userId} at ${new Date().toISOString()}`);
    next();
  });

  // Routes
  router.get('/search', searchProducts);  
  router.get('/', getProducts);
  router.get('/:id', validateObjectId('id'), getProductById);
  router.post('/:id/review', authMiddleware, addReview);
  router.post('/', authMiddleware, checkAdmin, createProduct);
  router.post('/upload', authMiddleware, checkAdmin, upload.single('image'), uploadProductImage);
  router.put('/:id', authMiddleware, checkAdmin, validateObjectId('id'), updateProduct);
  router.delete('/:id', authMiddleware, checkAdmin, validateObjectId('id'), deleteProduct);

module.exports = router;