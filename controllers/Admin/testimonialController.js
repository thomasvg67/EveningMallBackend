import Testimonial from '../../models/Testimonials.js';
import LoginUser from '../../models/LoginUser.js';
import RegisteredUser from '../../models/RegisteredUser.js';

export const createTestimonial = async (req, res) => {
  try {
    const { name, profession, message, rating } = req.body;
    const image = req.file?.path;
    const userId = req.user?.userId;
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    if (!name || !message || !rating || !image) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Admin validation (same as product creation)
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser || loginUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create testimonials' });
    }

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    const adminName = registeredUser?.name || 'Unknown Admin';

    const testimonial = new Testimonial({
      name,
      profession,
      image,
      message,
      rating,
      sts: 0, // default as draft
      createdBy: adminName,
      createdOn: new Date(),
      ip: ip,
    });

    await testimonial.save();

    res.status(201).json({ message: 'Testimonial created', testimonial });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating testimonial' });
  }
};

export const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ dlt_sts: 0 }).sort({ createdOn: -1 });
        res.json({ testimonials });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
};

export const togglePublishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expect 0 or 1

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return res.status(404).json({ message: 'Testimonial not found' });

    testimonial.sts = status; // 0 or 1
    testimonial.publishedOn = status === 1 ? new Date() : null;

    await testimonial.save();

    res.json({ message: 'Status updated', testimonial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error toggling status' });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profession, message, rating } = req.body;
    const userId = req.user?.userId;
    const image = req.file?.path;

    // Validate login user
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser || loginUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update testimonials' });
    }

    // Get registered admin name
    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    const adminName = registeredUser?.name || 'Unknown Admin';

    // Find testimonial
    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    // Apply updates
    if (name) testimonial.name = name;
    if (profession !== undefined) testimonial.profession = profession;
    if (message !== undefined) testimonial.message = message;
    if (rating !== undefined) testimonial.rating = rating;

    if (image) {
      testimonial.image = image; // Replace old image only if new one is uploaded
    }

    testimonial.updatedBy = adminName;
    testimonial.updatedOn = new Date();

    await testimonial.save();

    res.status(200).json({ message: 'Testimonial updated', testimonial });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error updating testimonial' });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    // Soft delete
    testimonial.dlt_sts = 1;
    testimonial.deletedOn = new Date();

    await testimonial.save();

    res.status(200).json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error deleting testimonial' });
  }
};
