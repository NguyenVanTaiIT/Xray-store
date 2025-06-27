const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.get('/', authMiddleware, orderController.getOrders);
router.post('/', authMiddleware, orderController.createOrder);

module.exports = router;