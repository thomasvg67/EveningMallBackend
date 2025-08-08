import mongoose from 'mongoose';

const loginUserSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  dailyLoginCount: { type: Number, default: 1 },
  role: {type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  logout: { type: Date, default: null },

  createdBy: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  
  createdIP: { type: String, required: true },
  updatedIP: { type: String, default: null },

  deletedBy: { type: String, default: null },
  deletedOn: { type: Date, default: null },

  sts: { type: Number, default: 0 } // 1 = Active, 0 = Inactive
});

export default mongoose.model('LoginUser', loginUserSchema);
