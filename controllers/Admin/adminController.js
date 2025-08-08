import RegisteredUser from '../../models/RegisteredUser.js';
import LoginUser from '../../models/LoginUser.js';
import { decrypt, encrypt } from '../../utils/encrypt.js';

export const getAllUsers = async (req, res) => {
  try {
    const loginUsers = await LoginUser.find({ role: 'user' });
    const registeredUsers = await RegisteredUser.find();

    const users = [];

    for (let loginUser of loginUsers) {
      const decryptedEmail = decrypt(loginUser.email);
      const matchingRegisteredUser = registeredUsers.find(
        reg => reg.email === loginUser.email
      );

      users.push({
        uid: matchingRegisteredUser?.USID || '-',
        ip: loginUser.ip || '-',
        name: matchingRegisteredUser?.name || '-',
        email: decryptedEmail || '-',
        mobile: matchingRegisteredUser?.mobile ? decrypt(matchingRegisteredUser.mobile) : '-',
        address: matchingRegisteredUser?.address || '-',
        createdIp: matchingRegisteredUser?.createdIP || '-',
        updatedIp: matchingRegisteredUser?.updatedIP || 'null',
        createdBy: matchingRegisteredUser?.createdBy || '-',
        createdAt: matchingRegisteredUser?.createdOn?.toISOString() || '-',
        loginTime: loginUser.loginTime?.toISOString() || '-',
        logoutTime: loginUser.logout?.toISOString() || '-',
        loginCount: loginUser.dailyLoginCount || 0,
        updatedBy: matchingRegisteredUser?.updatedBy || '-',
        deletedAt: loginUser.deletedOn?.toISOString() || '-',
        deletedBy: loginUser.deletedBy || '-',
        status: matchingRegisteredUser.sts === 1 ? 'Active' : 'Inactive'
      });
    }

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ message: 'Error retrieving users' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { uid } = req.params;

    const registeredUser = await RegisteredUser.findOne({ USID: Number(uid) });
    if (!registeredUser) {
      return res.status(404).json({ message: 'Registered user not found' });
    }

    const loginUser = await LoginUser.findOne({ email: registeredUser.email });
    if (!loginUser) {
      return res.status(404).json({ message: 'Login user not found' });
    }

    registeredUser.sts = registeredUser.sts === 1 ? 0 : 1;
    await registeredUser.save();

    res.json({
      message: 'Status updated',
      status: registeredUser.sts === 1 ? 'Active' : 'Inactive',
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Failed to toggle status' });
  }
};