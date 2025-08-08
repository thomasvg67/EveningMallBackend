import express from 'express';
import {  getAllProducts, getProductByPID, searchProducts, getRatingBreakdown, getProductsByType} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const productRouter = express.Router();

productRouter.get('/view-public',  getAllProducts);
productRouter.get('/search', searchProducts);
productRouter.get('/rating-stats', getRatingBreakdown);

productRouter.get('/detail/:pid', getProductByPID);

productRouter.get('/type/:type', getProductsByType);


export default productRouter;