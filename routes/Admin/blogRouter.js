import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { uploadBlogImage } from '../../middleware/BlogMiddleware.js';
import { createBlog, getAllBlogs, toggleBlogStatus, updateBlog, deleteBlog } from '../../controllers/Admin/blogController.js';

const BlogRouter = express.Router();

BlogRouter.post('/add', protect(['admin']), uploadBlogImage.fields([{ name: 'image', maxCount: 1 }]), createBlog);

BlogRouter.get('/view', protect(['admin']), getAllBlogs);

BlogRouter.put('/update/:id', protect(['admin']), uploadBlogImage.fields([{ name: 'image', maxCount: 1 }]), updateBlog);

BlogRouter.put('/toggle-status/:id', protect(['admin']), toggleBlogStatus);

BlogRouter.put('/delete/:id', protect(['admin']), deleteBlog);

export default BlogRouter;
