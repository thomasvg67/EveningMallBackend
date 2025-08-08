// routes/reviewRoutes.js
import express from 'express';
import { submitReview, getReviewsByPID, getRatingBreakdown } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const reviewRouter = express.Router();

reviewRouter.post('/submit', protect(), submitReview);
reviewRouter.get('/:pid', getReviewsByPID);
reviewRouter.get('/breakdown/:pid', getRatingBreakdown);

export default reviewRouter;
