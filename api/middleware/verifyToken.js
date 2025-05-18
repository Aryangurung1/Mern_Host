import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
    console.log("Cookies:", req.cookies);  // Debugging Line

    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Not Authenticated!" });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (err) {
            return res.status(403).json({ message: "Token is not Valid!" });
        }

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.userId = payload.id;
        req.isAdmin = payload.isAdmin;
        next();
    });
};


// Optional: Admin verification middleware
export const verifyAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ message: "Not Authorized as Admin!" });
    }
    next();
};