import express from 'express';
import { getAllUsers, toggleUserStatus } from '../../controllers/Admin/adminController.js';
import { protect } from '../../middleware/authMiddleware.js';

const adminRouter = express.Router();

adminRouter.get('/users', protect(['admin']), getAllUsers);

adminRouter.patch('/users/status/:uid', protect(['admin']), toggleUserStatus)

export default adminRouter;