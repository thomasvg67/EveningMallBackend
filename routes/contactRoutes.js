import express from 'express';
import { subscribeNewsletter, unsubscribeNewsletter, sendContactMessage } from '../controllers/contactController.js';

const ContactRouter = express.Router();

ContactRouter.post('/subscribe', subscribeNewsletter);
ContactRouter.get('/unsubscribe/:id', unsubscribeNewsletter);
ContactRouter.post('/send-contact', sendContactMessage);

export default ContactRouter;
