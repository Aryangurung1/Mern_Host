import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    images: [String],
    address: String,
    city: String,
    bedroom: Number,
    bathroom: Number,
    latitude: String,
    longitude: String,
    type: {
        type: String,
        enum: ['buy', 'rent'],
        required: true,
    },
    property: {
        type: String,
        enum: ['apartment', 'house', 'condo', 'land'],
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

export default Post;