import stripe from '../utils/stripe.js';
import Order from '../models/Order.js';
import LoginUser from '../models/LoginUser.js';
import { decrypt } from '../utils/encrypt.js';
import { clearCartForUser } from '../utils/cartHelpers.js';
import dotenv from 'dotenv';
dotenv.config();

export const createCheckoutSession = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, billingAddress, shippingCost } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        ...items.map(item => ({
          price_data: {
            currency: 'inr',
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.price * 100), // individual price
          },
          quantity: item.quantity,
        })),
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'Shipping Fee',
            },
            unit_amount: Math.round(shippingCost * 100), // e.g. ₹5
          },
          quantity: 1, // Shipping is a single item
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
      metadata: {
        shipping: JSON.stringify(shippingAddress),
        billing: JSON.stringify(billingAddress),
        items: JSON.stringify(items),
        totalAmount: totalAmount.toString()
      }
    });

    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const confirmCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Parse metadata
    const shippingAddress = JSON.parse(session.metadata.shipping);
    const billingAddress = JSON.parse(session.metadata.billing);

    // Get user info from token
    const userId = req.user.userId;
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'User not found' });

    const decryptedEmail = decrypt(loginUser.email);
    const decryptedName = loginUser.name ? decrypt(loginUser.name) : decryptedEmail;

    // Get line items from Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    const items = lineItems.data.map(item => ({
      name: item.description,
      quantity: item.quantity,
      price: item.amount_total / item.quantity / 100,
      // productId: optional future field
    }));

    // Shipping cost from your selected option
    const shippingCost = session.total_details?.amount_shipping
      ? session.total_details.amount_shipping / 100
      : 0;

    // Total amount
    const totalAmount = session.amount_total / 100;

    // Save order
    const newOrder = new Order({
      userId: loginUser._id,
      items,
      totalAmount,
      shippingCost,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      paymentId: session.payment_intent,
      shippingAddress,
      billingAddress,
      createdBy: decryptedName,
      createdOn: new Date()
    });

    await newOrder.save();
    await clearCartForUser(req.user.userId);


    res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.orderId });

  } catch (err) {
    console.error('Order Save Error:', err);
    res.status(500).json({ error: err.message });
  }
};

