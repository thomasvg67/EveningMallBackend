import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: Number, // or mongoose.Schema.Types.ObjectId if using ObjectId
    required: true,
    unique: true,
    ref: 'RegisteredUser' // based on USID
  },
  items: [
    {
      productId: {
        type: Number, 
        required: true,
        ref: 'Product'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

export default mongoose.model('Wishlist', wishlistSchema);
