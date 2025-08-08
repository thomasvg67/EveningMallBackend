import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Slider from '../models/Slider.js';

export const getTopProductsByKeyword = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim();
    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required' });
    }

    const searchRegex = new RegExp(keyword, 'i');

    // 🔍 Step 1: Lookup matching category & subcategory by regex
    const [categoryDocs, subCatDocs] = await Promise.all([
      Category.find({ name: { $regex: searchRegex }, dlt_sts: 0 }, 'catId'),
      SubCategory.find({ name: { $regex: searchRegex }, dlt_sts: 0 }, 'subCatId'),
    ]);

    const categoryIds = categoryDocs.map(c => c.catId);
    const subCatIds = subCatDocs.map(s => s.subCatId);

    // 🔍 Step 2: Search for matching products
    const products = await Product.find({
      dlt_sts: 0,
      avgRtng: { $gte: 4 },
      $or: [
        { name: searchRegex },
        { tags: { $in: [searchRegex] } },
        { catId: { $in: categoryIds } },
        { subCatId: { $in: subCatIds } }
      ]
    })
      .sort({ createdOn: -1 })
      .limit(4);

    res.status(200).json({ products });
  } catch (error) {
    console.error('Top Products API error:', error);
    res.status(500).json({ message: 'Server error fetching top products' });
  }
};

export const getNewArrivalProducts = async (req, res) => {
  try {
    const products = await Product.find({ dlt_sts: 0 })
      .sort({ createdOn: -1 })
      .limit(7);

    res.json({ products });
  } catch (error) {
    console.error('New Arrivals Error:', error);
    res.status(500).json({ message: 'Server error fetching new arrivals' });
  }
};

export const getProductsByType = async (req, res) => {
  try {
    const type = req.query.type; // 'featured', 'trending', etc.
    const limit = parseInt(req.query.limit) || 10;

    if (!type) {
      return res.status(400).json({ message: 'Product type is required' });
    }

    const products = await Product.find({
      dlt_sts: 0,
      prdType: type
    })
      .sort({ createdOn: -1 })
      .limit(limit);

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products by type:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

export const getBestSellingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 7;

    const products = await Product.find({
      dlt_sts: 0,
      avgRtng: { $gte: 4 }
    })
      .sort({ avgRtng: -1, createdOn: -1 }) // highest-rated + latest first
      .limit(limit);

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching best selling products:', error);
    res.status(500).json({ message: 'Server error fetching best selling products' });
  }
};

export const getTopRatedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 7;

    const products = await Product.find({ dlt_sts: 0 })
      .sort({ avgRtng: -1, createdOn: -1 }) // strict descending by rating
      .limit(limit);

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching top rated products:', error);
    res.status(500).json({ message: 'Server error fetching top rated products' });
  }
};

export const getPublishedSliders = async (req, res) => {
  try {
    const sliders = await Slider.find({ sts: 1, dlt_sts: 0 });
    res.status(200).json({ sliders });
  } catch (err) {
    console.error('Public slider fetch error:', err);
    res.status(500).json({ message: 'Server error fetching sliders' });
  }
};
