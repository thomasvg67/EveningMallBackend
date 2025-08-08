import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
    name: { type: String, required: true },
    profession: { type: String },
    image: { type: String },
    message: { type: String, required: true },
    rating: { type: Number, required: true, min: 0.5, max: 5 },
    sts: { type: Number, default: 0 },
    createdBy: { type: String, },
    createdOn: { type: Date, default: Date.now },
    ip: { type: String },
    updatedOn: { type: Date },
    updatedBy: { type: String },
    publishedOn: { type: Date },
    dlt_sts: { type: Number, default: 0 },
    deletedOn: { type: Date }
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;