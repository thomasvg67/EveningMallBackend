import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose);

const reviewSchema = new mongoose.Schema({
  RID: { type: Number, unique: true },
  PID: { type: Number, required: true, ref: 'Product' }, // Linked to Product.PID
  name: { type: String, default: 'Anonymous' }, // User name or 'Anonymous'
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  createdBy: { type: String },
  createdOn: { type: Date, default: Date.now },
  createdIP: { type: String },
  deletedBy: { type: String, default: null },
  deletedOn: { type: Date, default: null },
  deletedIP: { type: String, default: null },
  dlt_sts: { type: Number, default: 0 }, // 0 = active, 1 = deleted
});

reviewSchema.plugin(AutoIncrement, { inc_field: 'RID' });

const Review = mongoose.model('Review', reviewSchema);
export default Review;