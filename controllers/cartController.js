import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import RegisteredUser from '../models/RegisteredUser.js';
import LoginUser from '../models/LoginUser.js';

export const getUserCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const loginUser = await LoginUser.findById(userId);
        if (!loginUser) return res.status(404).json({ message: 'User not found' });

        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        const userUSID = registeredUser.USID;

        const cart = await Cart.findOne({ userId: userUSID }).populate({
            path: 'items.productId',
            model: 'Product',
            match: {}, // optional: add filters here if needed
            select: 'name price imgMain', // only fetch what you need
            options: {},
            localField: 'productId',
            foreignField: 'PID',
            justOne: true
        });

        if (!cart) return res.status(404).json({ message: 'Cart is empty' });

        res.status(200).json({ cart });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({ message: 'Failed to get cart', error: error.message });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.userId;

        const loginUser = await LoginUser.findById(userId);
        if (!loginUser) return res.status(404).json({ message: 'User not found in login table' });

        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        const userUSID = registeredUser.USID;

        let cart = await Cart.findOne({ userId: userUSID });

        if (!cart) {
            // Create new cart
            cart = new Cart({
                userId: userUSID,
                items: [{
                    productId,
                    quantity,
                    addedAt: new Date(),
                    updatedAt: new Date()
                }],
                updatedAt: new Date()
            });
        } else {
            // Update existing cart
            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
                cart.items[itemIndex].updatedAt = new Date();
            } else {
                cart.items.push({
                    productId,
                    quantity,
                    addedAt: new Date(),
                    updatedAt: new Date()
                });
            }
            cart.updatedAt = new Date();
        }

        await cart.save();
        res.status(200).json({ message: 'Item added to cart successfully', cart });
    } catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({ message: 'Failed to add to cart', error: error.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const loginUserId = req.user.userId; // from JWT

        const loginUser = await LoginUser.findById(loginUserId);
        if (!loginUser) return res.status(404).json({ message: 'User not found in login table' });

        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        const userUSID = registeredUser.USID;

        const { quantity } = req.body;
        const productId = Number(req.body.productId); // Make sure it's number

        if (!productId || quantity < 1) {
            return res.status(400).json({ message: 'Invalid request' });
        }

        const cart = await Cart.findOne({ userId: userUSID });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find(item => item.productId === productId);
        if (!item) return res.status(404).json({ message: 'Item not found in cart' });

        item.quantity = quantity;
        item.updatedAt = new Date();
        cart.updatedAt = new Date();

        await cart.save();
        res.status(200).json({ message: 'Cart item updated', cart });
    } catch (error) {
        console.error('Update Cart Item Error:', error);
        res.status(500).json({ message: 'Failed to update cart item', error: error.message });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const loginUserId = req.user.userId; // from token

        // 1. Get the login user
        const loginUser = await LoginUser.findById(loginUserId);
        if (!loginUser) return res.status(404).json({ message: 'User not found in login table' });

        // 2. Get the registered user
        const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
        if (!registeredUser) return res.status(404).json({ message: 'Registered user not found' });

        // 3. Get USID (number) to match cart schema
        const userUSID = registeredUser.USID;

        // 4. Get productId from route param
        const productId = Number(req.params.productId); // Ensure it's a Number to match cart schema

        const cart = await Cart.findOne({ userId: userUSID });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const initialLength = cart.items.length;

        // Remove the matching item by PID
        cart.items = cart.items.filter(item => item.productId !== productId);

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        cart.updatedAt = new Date();
        await cart.save();

        res.status(200).json({ message: 'Item removed from cart', cart });
    } catch (error) {
        console.error('Remove Cart Item Error:', error);
        res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
    }
};