import express from 'express';
import { encryptPassword } from './utils/cryptoutils.js';
import { 
  getUserFromDB, 
  put_item, 
  delete_item, 
  update_item 
} from './utils/dbutils.js';
import jwt from 'jsonwebtoken';


//TODO : Move the "@123" to a .env file
//TODO : Move the paths to a config file

const router = express.Router();
const USER_TABLE_NAME = 'tmcdevuserdb';

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key'); // Use the same SECRET_KEY as in auth.js
    if (decoded.username !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Route to create a new user
router.post('/create-user', verifyAdmin, async (req, res) => {
  const { userid, company } = req.body;
  console.log("🔍 Received create user request:", { userid, company });

  if (!userid || !company) {
    return res.status(400).json({ message: 'Username and company are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await getUserFromDB(userid);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate password as companyname@123
    const password = `${company}@123`;
    const encryptedPassword = await encryptPassword(password);

    // Prepare new user item
    const newUser = {
      userid: { S: userid },
      password: { S: encryptedPassword },
      company: { S: company },
      loginattempts: { N: '0' },
      defaultpasswordchanged: { S: 'false' },
    };

    // Add new user to DynamoDB
    await put_item(USER_TABLE_NAME, newUser);
    console.log(`✅ User ${userid} created successfully`);
    res.json({ message: 'User created successfully', userid });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to delete a user
router.delete('/delete-user', verifyAdmin, async (req, res) => {
  const { userid } = req.body;
  console.log("🔍 Received delete user request:", { userid });

  if (!userid) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // Check if user exists
    const user = await getUserFromDB(userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user from DynamoDB
    await delete_item(USER_TABLE_NAME, 'userid', userid, 'password', user.password);
    console.log(`✅ User ${userid} deleted successfully`);
    res.json({ message: 'User deleted successfully', userid });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to reset a user
router.post('/reset-user', verifyAdmin, async (req, res) => {
  const { userid } = req.body;
  console.log("🔍 Received reset user request:", { userid });

  if (!userid) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // Check if user exists
    const user = await getUserFromDB(userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new password as companyname@123
    const password = `${user.company}@123`;
    const encryptedPassword = await encryptPassword(password);

    // Delete existing item and create new one with reset values
    await delete_item(USER_TABLE_NAME, 'userid', userid, 'password', user.password);
    const updatedUser = {
      userid: { S: userid },
      password: { S: encryptedPassword },
      company: { S: user.company },
      loginattempts: { N: '0' },
      defaultpasswordchanged: { S: 'false' },
    };

    await put_item(USER_TABLE_NAME, updatedUser);
    console.log(`✅ User ${userid} reset successfully`);
    res.json({ message: 'User reset successfully', userid });
  } catch (error) {
    console.error("❌ Error resetting user:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
