import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(mongoose); // Bind to Mongoose instance

const registeredUserSchema = new mongoose.Schema({
  USID: { type: Number, unique: true }, // Auto-incremented UID
  ip: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },


  billingAddress1: {
    firstName: String, lastName: String, company: String, street1: String, street2: String, city: String,
    state: String, zip: String, country: String, phone: String, email: String
  },
  billingAddress2: {
    firstName: String, lastName: String, company: String, street1: String, street2: String, city: String,
    state: String, zip: String, country: String, phone: String, email: String
  },
  billingAddress3: {
    firstName: String, lastName: String, company: String, street1: String, street2: String, city: String,
    state: String, zip: String, country: String, phone: String, email: String
  },
  shippingAddress1: {
    firstName: String, lastName: String, company: String, street1: String, street2: String, city: String,
    state: String, zip: String, country: String, phone: String, email: String
  },
  shippingAddress2: {
    firstName: String, lastName: String, company: String, street1: String, street2: String, city: String,
    state: String, zip: String, country: String, phone: String, email: String
  },
  shippingAddress3: {
    firstName: String, lastName: String, company: String, street1: String, street2: String, city: String,
    state: String, zip: String, country: String, phone: String, email: String
  },


  createdIP: { type: String, required: true },
  updatedIP: { type: String, default: null },

  createdBy: { type: String, default: null },
  createdOn: { type: Date, default: Date.now },

  loginTime: { type: Date, default: null },
  logout: { type: Date, default: null },

  updatedBy: { type: String, default: null },
  updatedOn: { type: Date, default: null },

  deletedBy: { type: String, default: null },
  deletedOn: { type: Date, default: null },


  sts: { type: Number, default: 0 } // 0 = Not logged in, 1 = Logged in
});

// Apply auto-increment plugin to UID field
registeredUserSchema.plugin(AutoIncrement, {
  inc_field: 'USID',
  start_seq: 1111
});

const RegisteredUser = mongoose.model('RegisteredUser', registeredUserSchema);
export default RegisteredUser;
