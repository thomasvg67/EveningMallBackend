import express from 'express';
import { getMyOrders } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const orderRouter = express.Router();

orderRouter.get('/my', protect(),getMyOrders) 

export default orderRouter;
