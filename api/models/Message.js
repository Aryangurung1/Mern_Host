import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message;