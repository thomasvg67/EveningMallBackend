import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ dlt_sts: 0 }).sort({ name: 1 });
    res.status(200).json({ brands });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ message: 'Server error fetching brands' });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ dlt_sts: 0 }).sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};
