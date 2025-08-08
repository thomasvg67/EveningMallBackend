import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose);

const cartSchema = new mongoose.Schema({
  CID: {
    type: Number,
    unique: true
  },
  userId: {
    type: Number,
    ref: 'RegisteredUser', // referencing USID
    required: true
  },
  items: [
    {
      productId: {
        type: Number,
        ref: 'Product', // referencing PID
        required: true
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: null
      }
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-increment the Cart ID (CID) starting from 1111
cartSchema.plugin(AutoIncrement, {
  inc_field: 'CID',
  start_seq: 1111
});

export default mongoose.model('Cart', cartSchema);
