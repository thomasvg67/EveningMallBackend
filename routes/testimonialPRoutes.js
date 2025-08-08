import express from 'express';
import { getPublishedTestimonials } from '../controllers/testimonialPController.js';

const testimonialRouter = express.Router();
testimonialRouter.get('/view', getPublishedTestimonials);

export default testimonialRouter;
