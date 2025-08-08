import express from 'express';
import { getTopProductsByKeyword, getNewArrivalProducts, getProductsByType, getBestSellingProducts, getTopRatedProducts, getPublishedSliders } from '../controllers/homeController.js';

const homeRouter = express.Router();

homeRouter.get('/top-products', getTopProductsByKeyword);
homeRouter.get('/new-arrivals', getNewArrivalProducts);
homeRouter.get('/products-by-type', getProductsByType);
homeRouter.get('/best-selling', getBestSellingProducts);
homeRouter.get('/top-rated', getTopRatedProducts);
homeRouter.get('/sliders/view', getPublishedSliders);

export default homeRouter;
