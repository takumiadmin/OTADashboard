import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your-secret-key'; // Keep this secure in production

export const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Attach user info to request object
        console.log("🔐 Authenticated User:", decoded.username);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
