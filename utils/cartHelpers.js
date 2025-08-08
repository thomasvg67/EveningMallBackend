import Cart from '../models/Cart.js';
import RegisteredUser from '../models/RegisteredUser.js';
import LoginUser from '../models/LoginUser.js';

export const clearCartForUser = async (loginUserId) => {
  const loginUser = await LoginUser.findById(loginUserId);
  if (!loginUser) throw new Error('Login user not found');

  const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
  if (!registeredUser) throw new Error('Registered user not found');

  const userUSID = registeredUser.USID;

  await Cart.findOneAndUpdate(
    { userId: userUSID },
    { $set: { items: [], updatedAt: new Date() } }
  );
};
