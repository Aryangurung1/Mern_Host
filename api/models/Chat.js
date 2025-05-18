import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userIDs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    seenBy: [mongoose.Schema.Types.ObjectId],
    lastMessage: String,
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;