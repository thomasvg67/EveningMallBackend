// routes/admin/sliderAdminRouter.js
import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { uploadSliderImage } from '../../middleware/SliderMiddleware.js';
import { createSlider, deleteSlider, getAllSliders, toggleSliderStatus, updateSlider } from '../../controllers/Admin/sliderController.js';

const SliderRouter = express.Router();

SliderRouter.post( '/add', protect(['admin']), uploadSliderImage.fields([ { name: 'image', maxCount: 1 }, { name: 'brandImg', maxCount: 1 } ]), createSlider);

SliderRouter.get('/view', protect(['admin']), getAllSliders);

SliderRouter.put('/update/:id', protect(['admin']), uploadSliderImage.fields([ { name: 'image', maxCount: 1 }, { name: 'brandImg', maxCount: 1 } ]), updateSlider );

SliderRouter.put('/delete/:id', protect(['admin']), deleteSlider);

SliderRouter.put('/toggle-status/:id', protect(['admin']), toggleSliderStatus);

export default SliderRouter;
