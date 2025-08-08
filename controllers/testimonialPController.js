import Testimonial from '../models/Testimonials.js';

export const getPublishedTestimonials = async (req, res) => {
  try {
    const published = await Testimonial.find({ sts: 1, dlt_sts: 0 })
      .sort({ createdOn: -1 })
      .select('name profession message rating image');

    res.json({ testimonials: published });
  } catch (err) {
    console.error('Public testimonial fetch error:', err);
    res.status(500).json({ message: 'Failed to load testimonials' });
  }
};
