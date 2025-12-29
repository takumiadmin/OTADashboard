import express from 'express';
import jwt from 'jsonwebtoken';
import { decryptPassword } from './utils/cryptoutils.js';
import { getUserFromDB, updateLoginAttempts, updateUserPassword } from './utils/dbutils.js';

const router = express.Router();
const SECRET_KEY = 'your-secret-key'; // Use a strong secret in production
const MAX_ATTEMPTS = 3;

// Password validation function
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUpperCase) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumbers) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChars) {
        return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }

    return { isValid: true };
};

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("🔍 Received login request:", { username });

    try {
        const user = await getUserFromDB(username);
        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const storedPassword = await decryptPassword(user.password);
        console.log(`🔍 Stored encrypted password: ${user.password.substring(0, 50)}... (length: ${user.password.length})`);
        console.log(`🔍 Stored password (decrypted): ${storedPassword}, Input password: ${password}`);
        if (password !== storedPassword) {
            console.log("❌ Incorrect password");
            const newAttempts = user.loginattempts + 1;
            await updateLoginAttempts(username, user.password, newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                return res.status(401).json({ message: 'Contact admin. Your account has been locked' });
            }

            const remainingAttempts = MAX_ATTEMPTS - newAttempts;
            return res.status(401).json({ message: `Invalid password ! ${remainingAttempts} attempt(s) left`, remainingAttempts });
        }

        // Check if default password needs to be changed (non-admin users only)
        if (user.defaultpasswordchanged === 'false' && username !== 'admin') {
            console.log("🔍 First login detected, password change required");
            return res.status(403).json({ message: 'First login: Please change your default password', mustChangePassword: true });
        }

        // Reset login attempts to 0 on successful login
        if (user.loginattempts > 0) {
            await updateLoginAttempts(username, user.password, 0);
        }

        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        console.log("✅ Login successful, sending token...");
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error("❌ Authentication error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User data endpoint
router.get('/user', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("🔍 Received user data request, token:", token);
    if (!token) {
        console.log("❌ Unauthorized: No token provided");
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("🔍 Token decoded, username:", decoded.username);
        const username = decoded.username;
        const user = await getUserFromDB(username);
        if (!user) {
            console.log("❌ User not found:", username);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("✅ User data retrieved:", { username, defaultpasswordchanged: user.defaultpasswordchanged });
        res.json({
            defaultpasswordchanged: user.defaultpasswordchanged,
        });
    } catch (error) {
        console.error("❌ Error fetching user data:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change password endpoint
router.post('/change-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.username !== username) {
            return res.status(403).json({ message: 'Forbidden: Invalid user' });
        }

        const user = await getUserFromDB(username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const storedPassword = await decryptPassword(user.password);
        if (currentPassword !== storedPassword) {
のうち

            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Validate new password for all users
        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.message });
        }

        // Update password and set defaultpasswordchanged to true
        const success = await updateUserPassword(username, newPassword);
        if (!success) {
            throw new Error('Failed to update password');
        }

        console.log(`✅ Password changed successfully for ${username}`);
        res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
        console.error("❌ Error changing password:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
