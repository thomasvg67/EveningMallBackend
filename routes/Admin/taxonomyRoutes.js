import express from 'express';
import { searchBrands, searchCategories, searchSubCategories } from '../../controllers/Admin/taxonomyController.js';
import { protect } from '../../middleware/authMiddleware.js';

const taxonomyRouter = express.Router();

taxonomyRouter.get('/brands', protect(['admin']), searchBrands);
taxonomyRouter.get('/categories', protect(['admin']), searchCategories);
taxonomyRouter.get('/subcategories', protect(['admin']), searchSubCategories);

export default taxonomyRouter;