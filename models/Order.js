import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(mongoose);

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, unique: true },

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoginUser', required: true },

  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional for future linking
      name: String,
      quantity: Number,
      price: Number
    }
  ],

  totalAmount: { type: Number, required: true },
  shippingCost: { type: Number, required: true },

  paymentMethod: { type: String, enum: ['stripe', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'failed'], required: false },
  paymentId: { type: String },

  shippingAddress: {
    firstName: String, lastName: String, company: String,
    street1: String, street2: String, city: String,
    state: String, zip: String, country: String,
    phone: String, email: String
  },

  billingAddress: {
    firstName: String, lastName: String, company: String,
    street1: String, street2: String, city: String,
    state: String, zip: String, country: String,
    phone: String, email: String
  },
  status: { type: String, enum: ['processing', 'shipped', 'delivered', 'cancelled'], default: 'processing' },

  createdBy: { type: String }, // decrypted user name or email
  createdOn: { type: Date, default: Date.now }
});

// Auto-increment `orderId` from 1111
orderSchema.plugin(AutoIncrement, {
  inc_field: 'orderId',
  start_seq: 1111
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
