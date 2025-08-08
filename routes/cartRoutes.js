import express from 'express';
import { getUserCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const cartRouter = express.Router();

cartRouter.get('/view', protect(), getUserCart);
cartRouter.post('/add', protect(), addToCart);
cartRouter.put('/update', protect(), updateCartItem);
cartRouter.delete('/remove/:productId', protect(), removeCartItem);

export default cartRouter;