import mongoose from "mongoose";

const postDetailSchema = new mongoose.Schema({
    desc: {
        type: String,
        required: true,
    },
    utilities: String,
    pet: String,
    income: String,
    size: Number,
    school: Number,
    bus: Number,
    restaurant: Number,
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        unique: true,
    },
});

const PostDetail = mongoose.model("PostDetail", postDetailSchema);

export default PostDetail;