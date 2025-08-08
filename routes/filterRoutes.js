import express from 'express';
import { getAllBrands, getAllCategories } from '../controllers/filterController.js';

const filterRouter = express.Router();

filterRouter.get('/brands', getAllBrands);
filterRouter.get('/categories', getAllCategories);

export default filterRouter;
