import RegisteredUser from '../models/RegisteredUser.js';
import LoginUser from '../models/LoginUser.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import transporter from '../utils/emailTransport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, mobile, country, place, address, pincode } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    const encryptedEmail = encrypt(email);
    const encryptedMobile = encrypt(mobile);

    // Check if already registered
    const existing = await RegisteredUser.findOne({ email: encryptedEmail });
    if (existing) return res.status(400).json({ message: 'User already registered' });

    // Name splitting
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Address splitting
    const addressParts = address.split(',').map(p => p.trim());
    const street1 = addressParts[0] || '';
    const street2 = addressParts.slice(1).join(', ') || '';

    // Construct full address object
    const addressObject = {
      firstName,
      lastName,
      company: '',              // not provided by frontend yet
      street1,
      street2,
      city: place,
      state: '',                // not provided
      zip: pincode,
      country,
      phone: mobile,
      email
    };

    // Save to RegisteredUser
    const newUser = new RegisteredUser({
      ip, name, email: encryptedEmail, mobile: encryptedMobile,
      createdBy: name, createdIP: ip, createdOn: new Date(), sts: 0,
      billingAddress1: addressObject, shippingAddress1: addressObject
    });
    await newUser.save();

    // ✅ ADD LOGIN ENTRY
    const defaultPassword = email;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const loginUser = new LoginUser({
      ip,
      createdIP: ip,
      createdBy: name,
      email: encrypt(email),
      password: hashedPassword,
      role: 'user'
    });

    await loginUser.save();

    // 1. Load the email HTML template
    const templatePath = path.join(__dirname, '../templates/verifyaccount.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // 2. Replace placeholder with actual link
    const verifyLink = `${process.env.BACKEND_URL}/api/auth/verify/${newUser._id}`;
    htmlContent = htmlContent.replace(/__VERIFY_LINK__/g, verifyLink).replace(/__EMAIL__/g, email);

    // 3. Send email
    await transporter.sendMail({
      from: `"Evening Mall" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Verify your EveningMall account',
      html: htmlContent
    });


    res.status(201).json({ message: 'Registered successfully. Please check your email to verify your account.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// VERIFY USER
export const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await RegisteredUser.findById(id);

    if (!user) {
      return res.status(404).send('Invalid verification link.');
    }

    // if (user.sts === 1) {
    //   return res.redirect(`${process.env.FRONTEND_URL}/verified=already`);
    // }

    user.sts = 1;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}?verified=success`);
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('Something went wrong. Please try again later.');
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const encryptedEmail = encrypt(email);

    const user = await LoginUser.findOne({ email: encryptedEmail });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });



    // Get name from RegisteredUser
    const registeredUser = await RegisteredUser.findOne({ email: encryptedEmail });
    if (registeredUser.sts === 0) {
      return res.status(403).json({ message: 'Account is inactive. Please verify the account or contact support.' });
    }
    const name = registeredUser ? registeredUser.name : 'User';

    // Update login time and count
    user.loginTime = new Date();
    user.dailyLoginCount += 1;
    user.updatedOn = new Date();
    user.updatedBy = registeredUser?.name || 'self';
    user.updatedIP = ip;
    user.sts = 1;
    user.ip = ip;
    await user.save();

    if (registeredUser) {
      registeredUser.sts = 1;
      registeredUser.loginTime = new Date();
      await registeredUser.save();
    }


    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, role: user.role, name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const loginUser = await LoginUser.findById(userId);
    if (!loginUser) return res.status(404).json({ message: 'User not found in login table' });
    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });

    const logoutTime = new Date();

    if (loginUser) {
      loginUser.logout = logoutTime;
      // loginUser.sts = 1;
      await loginUser.save();
    }

    if (registeredUser) {
      registeredUser.logout = logoutTime;
      // registeredUser.sts = 1;
      await registeredUser.save();
    }
    res.json({ message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};