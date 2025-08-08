import Brand from '../../models/Brand.js';
import Category from '../../models/Category.js';
import SubCategory from '../../models/SubCategory.js';

export const searchBrands = async (req, res) => {
  const { search = '' } = req.query;
  const regex = new RegExp(search, 'i');
  const brands = await Brand.find({ name: regex, dlt_sts: 0 }).limit(10);
  res.json(brands);
};

export const searchCategories = async (req, res) => {
  const { search = '' } = req.query;
  const regex = new RegExp(search, 'i');
  const categories = await Category.find({ name: regex, dlt_sts: 0 }).limit(10);
  res.json(categories);
};

export const searchSubCategories = async (req, res) => {
  const { search = '', catId } = req.query;

  if (!catId) {
    return res.status(400).json({ message: 'Category ID is required for subcategory search' });
  }

  const regex = new RegExp(search, 'i');
  const subCategories = await SubCategory.find({
    name: regex,
    catId: Number(catId), // make sure it's compared as Number
    dlt_sts: 0
  }).limit(10);

  res.json(subCategories);
};
