import RegisteredUser from '../models/RegisteredUser.js';
import LoginUser from '../models/LoginUser.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import bcrypt from 'bcryptjs';

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'Login data not found' });

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

    res.json({
      name: registeredUser.name,
      email: decrypt(registeredUser.email),
      address: registeredUser.address1 || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, displayName, currentPassword, newPassword } = req.body;

    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'Login user not found' });

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

    // ✅ Update name
    registeredUser.name = displayName;
    registeredUser.updatedOn = new Date();
    registeredUser.updatedBy = displayName;
    await registeredUser.save();

    // ✅ Update password if provided
    if (newPassword && newPassword.trim() !== '') {
      const isMatch = await bcrypt.compare(currentPassword, loginUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hashedNew = await bcrypt.hash(newPassword, 10);
      loginUser.password = hashedNew;
      loginUser.updatedOn = new Date();
      loginUser.updatedBy = displayName;
      await loginUser.save();
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

export const getAllAddresses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'User not found' });

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

    const addresses = {
      billingAddress1: registeredUser.billingAddress1 || null,
      billingAddress2: registeredUser.billingAddress2 || null,
      billingAddress3: registeredUser.billingAddress3 || null,
      shippingAddress1: registeredUser.shippingAddress1 || null,
      shippingAddress2: registeredUser.shippingAddress2 || null,
      shippingAddress3: registeredUser.shippingAddress3 || null
    };


    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch addresses', error: error.message });
  }
};

export const getSingleAddress = async (req, res) => {
  const { type } = req.params; // address1, address2, address3
  const validTypes = [
    'billingAddress1', 'billingAddress2', 'billingAddress3',
    'shippingAddress1', 'shippingAddress2', 'shippingAddress3'
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid address type' });
  }

  try {
    const userId = req.user.userId;
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'User not found' });

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

    res.json({ [type]: registeredUser[type] || null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch address', error: error.message });
  }
};

export const updateAddress = async (req, res) => {
  const { type } = req.params;
  const validTypes = [
    'billingAddress1', 'billingAddress2', 'billingAddress3',
    'shippingAddress1', 'shippingAddress2', 'shippingAddress3'
  ];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid address type' });
  }

  try {
    const userId = req.user.userId;
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'User not found' });

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

    registeredUser[type] = req.body;
    registeredUser.updatedOn = new Date();
    registeredUser.updatedBy = registeredUser.name;
    await registeredUser.save();

    res.json({ message: `${type} updated successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update address', error: error.message });
  }
};
