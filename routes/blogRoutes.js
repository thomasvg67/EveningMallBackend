import express from 'express';
import { getBlogById, getPublicBlogs, getTopBlogs } from '../controllers/blogController.js';

const blogRouter = express.Router();

blogRouter.get('/list', getPublicBlogs);
blogRouter.get('/detail/:id', getBlogById);
blogRouter.get('/top', getTopBlogs);

export default blogRouter;