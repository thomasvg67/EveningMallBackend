import Wishlist from '../models/Wishlist.js';
import RegisteredUser from '../models/RegisteredUser.js';
import LoginUser from '../models/LoginUser.js';
import Product from '../models/Product.js';

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const pid = Number(productId); // ✅ Ensure it's a number

        const loginUser = await LoginUser.findById(req.user.userId);
        if (!loginUser) return res.status(404).json({ message: 'User not found in login table' });

        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        const userUSID = registeredUser.USID;

        let wishlist = await Wishlist.findOne({ userId: userUSID });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId: userUSID,
                items: [{ productId: pid, addedAt: new Date() }]
            });
        } else {
            const alreadyExists = wishlist.items.some(item => item.productId === pid);
            if (!alreadyExists) {
                wishlist.items.push({ productId: pid, addedAt: new Date() });
            }
        }

        await wishlist.save();
        res.status(200).json({ message: 'Product added to wishlist', wishlist });
    } catch (error) {
        console.error('Add to Wishlist Error:', error);
        res.status(500).json({ message: 'Failed to add to wishlist' });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        const loginUser = await LoginUser.findById(userId);
        if (!loginUser) return res.status(404).json({ message: 'User not found' });

        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        const userUSID = registeredUser.USID;

        const wishlist = await Wishlist.findOne({ userId: userUSID });
        if (!wishlist) return res.status(404).json({ message: 'Wishlist not found' });

        const initialLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter(item => item.productId !== productId);

        if (wishlist.items.length === initialLength) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        await wishlist.save();
        res.status(200).json({ message: 'Product removed from wishlist', wishlist });
    } catch (error) {
        console.error('Remove Wishlist Item Error:', error);
        res.status(500).json({ message: 'Failed to remove product from wishlist' });
    }
};

export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;

        const loginUser = await LoginUser.findById(userId);
        if (!loginUser) return res.status(404).json({ message: 'User not found' });

        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        const userUSID = registeredUser.USID;

        const wishlist = await Wishlist.findOne({ userId: userUSID });
        if (!wishlist) {
            return res.status(200).json({ wishlist: { items: [] } });
        }

        const productIds = wishlist.items.map(item => item.productId);
        const products = await Product.find({ PID: { $in: productIds } }).select('PID name price imgMain quantity');

        // Optional: map productId to item to merge product data
        const productMap = new Map(products.map(p => [p.PID, p]));

        const enrichedItems = wishlist.items.map(item => ({
            productId: item.productId,
            addedAt: item.addedAt,
            product: productMap.get(item.productId) || null
        }));

        res.status(200).json({
            wishlist: {
                userId: wishlist.userId,
                items: enrichedItems
            }
        });

    } catch (error) {
        console.error('Get Wishlist Error:', error);
        res.status(500).json({ message: 'Failed to retrieve wishlist' });
    }
};
