import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema({
  image: { type: String, required: true },           // 1903 x 600
  brandImg: { type: String },                        // 269 x 75, transparent
  subtitle: { type: String, },        // <h4> element
  title: { type: String, },
  alignment: { type: String },
  price: { type: String },                           // Optional
  buttonText: { type: String, },      // E.g. "Shop now"
  buttonLink: { type: String, },      // E.g. "/shop"
  sts: { type: Number, default: 0 },                 // 1 = published, max 4
  createdBy: { type: String },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date },
  dlt_sts: { type: Number, default: 0 },             // Soft delete
  deletedOn: { type: Date }
});

const Slider = mongoose.model('Slider', sliderSchema);
export default Slider;
