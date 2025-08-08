import Order from '../models/Order.js';
import LoginUser from '../models/LoginUser.js';
import RegisteredUser from '../models/RegisteredUser.js';
import { decrypt } from '../utils/encrypt.js';

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const orders = await Order.find({ userId }).sort({ createdOn: -1 });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};