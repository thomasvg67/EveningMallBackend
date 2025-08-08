import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    sts: {
        type: Number,
        default: 1 // 1 = subscribed, 0 = unsubscribed
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);
export default Newsletter;