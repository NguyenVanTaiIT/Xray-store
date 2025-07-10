const mongoose = require('mongoose');

const initializeModels = () => {
  const User = require('./User');
  const Product = require('./Product');
  const Order = require('./Order');
  const Cart = require('./Cart');

  return { User, Product, Order, Cart };
};

module.exports = initializeModels;