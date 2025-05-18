import User from '../models/User.js';

export const verifyAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admin only." });
        }
        
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({ message: "Error verifying admin status" });
    }
};
