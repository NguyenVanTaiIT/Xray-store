const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authMiddleware, checkAdmin } = require('../middleware/authMiddleware');
const { register, login, refreshToken, logout, getProfile, updateProfile, adminUpdateUser, getUsers, deleteUser } = require('../controllers/userController');
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
    console.log(`User route hit: ${req.method} ${req.originalUrl} by userId: ${userId} at ${new Date().toISOString()}`);
    next();
  });

  // Routes
  router.post('/register', register);
  router.post('/login', login);
  router.post('/refresh-token', refreshToken);
  router.post('/logout', authMiddleware, logout);
  router.get('/profile', authMiddleware, getProfile);
  router.put('/profile', authMiddleware, updateProfile);
  router.put('/:id', authMiddleware, checkAdmin, validateObjectId('id'), adminUpdateUser);
  router.get('/', authMiddleware, checkAdmin, getUsers);
  router.delete('/:id', authMiddleware, checkAdmin, validateObjectId('id'), deleteUser);


module.exports = router;