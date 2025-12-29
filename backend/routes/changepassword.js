import express from 'express';
import jwt from 'jsonwebtoken';
import { decryptPassword, encryptPassword } from './utils/cryptoutils.js';
import { getUserFromDB, updateUserPassword } from './utils/dbutils.js';

const router = express.Router();
// Use a strong secret in production

// Change Password Route
router.post('/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const username = decoded.username;
        console.log("🔍 Change password request for:", username);

        // Get user from DB
        const user = await getUserFromDB(username);
        if (!user) {
            console.log("❌ User not found");
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const storedPassword = await decryptPassword(user.password);
        if (oldPassword !== storedPassword) {
            console.log("❌ Incorrect old password");
            return res.status(401).json({ message: 'Incorrect old password' });
        }

        // Encrypt new password and update DB
        const encryptedNewPassword = await encryptPassword(newPassword);
        const finalencryptedNewPassword = await decryptPassword(encryptedNewPassword)
        await updateUserPassword(username, finalencryptedNewPassword);

        console.log("✅ Password updated successfully");
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error("❌ Error changing password:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
