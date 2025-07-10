const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authMiddleware, checkAdmin } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/adminController');
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
    console.log(`Admin route hit: ${req.method} ${req.originalUrl} by userId: ${userId} at ${new Date().toISOString()}`);
    next();
  });

  // Routes
  router.get('/stats', authMiddleware, checkAdmin, getDashboardStats);

module.exports = router;