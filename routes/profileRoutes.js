import express from 'express';
import { getProfile, updateProfile, getAllAddresses, getSingleAddress, updateAddress } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const ProfileRouter = express.Router();

ProfileRouter.get('/', protect(), getProfile);
ProfileRouter.put('/update', protect(), updateProfile); 
ProfileRouter.get('/addresses', protect(), getAllAddresses);
ProfileRouter.get('/address/:type', protect(), getSingleAddress);
ProfileRouter.put('/address/:type', protect(), updateAddress);

export default ProfileRouter;
