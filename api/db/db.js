import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const connectToDatabase = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error("MongoDB URI is missing in environment variables");
        }

        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB successfully!");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1); // Stop server if database connection fails
    }
};

export default connectToDatabase;
