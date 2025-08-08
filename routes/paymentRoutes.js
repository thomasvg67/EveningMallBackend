import express from 'express';
import { createCheckoutSession, confirmCheckoutSession } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-payment-intent', protect(), createCheckoutSession);
paymentRouter.post('/confirm', protect(), confirmCheckoutSession);


export default paymentRouter;
