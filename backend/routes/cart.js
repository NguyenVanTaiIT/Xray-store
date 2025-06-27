const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');

router.get('/', authMiddleware, cartController.getCart);
router.post('/', authMiddleware, cartController.addToCart);
router.put('/:productId', authMiddleware, cartController.updateCartItem);
router.delete('/:productId', authMiddleware, cartController.removeCartItem);
router.delete('/', authMiddleware, cartController.clearCart);

module.exports = router;