import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose);

const productSchema = new mongoose.Schema({
  PID: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: false
  },
  showDiscount: {
    type: Number,
    default: 0 // 0 = don't show discount, 1 = show discount
  },
  quantity: {
    type: Number,
    required: true
  },
  prdType: {
    type: String,
    enum: ['', 'trending', 'featured'],
    default: ''
  },
  brndId: {
    type: Number,
    ref: 'Brand'
  },
  catId: {
    type: Number,
    ref: 'Category'
  },
  subCatId: {
    type: Number,
    ref: 'SubCategory'
  },
  tags: {
    type: [String],
    default: []
  },
  avgRtng: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  imgMain: {
    type: String, // example: '/uploads/products/main-image.jpg'
    required: true
  },
  imgMulti: {
    type: [String], // array of image paths
    validate: [arr => arr.length <= 4, 'Maximum 4 images allowed']
  },
  createdBy: {
    type: String,
    required: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String
  },
  updatedOn: {
    type: Date
  },
  deletedBy: {
    type: String
  },
  deletedOn: {
    type: Date
  },
  dlt_sts: {
    type: Number,
    default: 0 // 0 = active, 1 = deleted
  },
});

// Auto-increment the PID field
productSchema.plugin(AutoIncrement, { inc_field: 'PID' });

const Product = mongoose.model('Product', productSchema);

export default Product;
