import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const wishlistRouter = express.Router();

wishlistRouter.get('/view', protect(), getWishlist);
wishlistRouter.post('/add', protect(), addToWishlist);
wishlistRouter.delete('/remove', protect(), removeFromWishlist);


export default wishlistRouter;
