import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { uploadTestimonial } from '../../middleware/uploadTestimonialMiddleware.js';
import { createTestimonial, getAllTestimonials, togglePublishStatus, updateTestimonial, deleteTestimonial } from '../../controllers/Admin/testimonialController.js';

const TestimonialRouter = express.Router();

TestimonialRouter.post('/add', protect(['admin']), uploadTestimonial.single('image'), createTestimonial);
TestimonialRouter.get('/view', protect(['admin']), getAllTestimonials);
TestimonialRouter.put('/toggle-status/:id', protect(['admin']), togglePublishStatus);
TestimonialRouter.put('/update/:id', protect(['admin']), uploadTestimonial.single('image'), updateTestimonial);
TestimonialRouter.put('/delete/:id', protect(['admin']), deleteTestimonial);

export default TestimonialRouter;
