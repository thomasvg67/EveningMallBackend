import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  heading: { type: String, required: true },
  description: { type: String, required: true },
  tags: [String],
  image: { type: String, required: true },

  sts: { type: Number, default: 0 },
  dlt_sts: { type: Number, default: 0 },
  categories: [String],
  publishDate: { type: Date },
  createdBy: { type: String },
  createdIP: { type: String },
  createdOn: { type: Date, default: Date.now },
  updatedBy: { type: String },
  updatedOn: { type: Date },
  deletedOn: { type: Date },
});

const Blog = mongoose.model('Blog', BlogSchema);
export default Blog;