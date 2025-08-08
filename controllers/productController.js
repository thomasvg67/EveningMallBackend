import Product from '../models/Product.js';
import RegisteredUser from '../models/RegisteredUser.js';
import LoginUser from '../models/LoginUser.js';
import Brand from '../models/Brand.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import { getSortCriteria } from '../utils/sortHelper.js';
import { buildSearchFilter, buildPriceFilter, buildRatingFilter } from '../utils/filterBuilder.js';


export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const skip = (page - 1) * limit;

    const [products, totalCount] = await Promise.all([
      Product.find({ dlt_sts: 0 })
        .skip(skip)
        .limit(limit)
        .sort({ createdOn: -1 })
        .populate({
          path: 'brndId',
          select: 'name brndId',
          match: { dlt_sts: 0 },
          localField: 'brndId',
          foreignField: 'brndId',
        })
        .populate({
          path: 'catId',
          select: 'name catId',
          match: { dlt_sts: 0 },
          localField: 'catId',
          foreignField: 'catId',
        })
        .populate({
          path: 'subCatId',
          select: 'name subCatId catId',
          match: { dlt_sts: 0 },
          localField: 'subCatId',
          foreignField: 'subCatId',
        }),

      Product.countDocuments({ dlt_sts: 0 }),
    ]);

    res.json({
      products,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

export const getProductByPID = async (req, res) => {
  try {
    const { pid } = req.params;

    // Find product by PID and ensure it's not deleted
    const product = await Product.findOne({ PID: pid, dlt_sts: 0 });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Error fetching product by PID:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

export const getCustomHtmlByPid = async (req, res) => {
  try {
    const product = await Product.findOne({ PID: req.params.pid, dlt_sts: { $ne: 1 } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ customHTML: product.customHTML || '' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRatingBreakdown = async (req, res) => {
  try {
    const search = req.query.q || '';
    const searchRegex = new RegExp(search, 'i');

    const baseQuery = {
      dlt_sts: 0,
      $or: [
        { name: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    };

    const tag = req.query.tag;
    if (tag) {
      baseQuery.tags = { $regex: new RegExp(tag, 'i') };
    }

    const brands = req.query.brands ? req.query.brands.split(',') : [];
    if (brands.length > 0) {
      const brandDocs = await Brand.find({ name: { $in: brands }, dlt_sts: 0 });
      const brandIds = brandDocs.map(b => b.brndId);
      if (brandIds.length > 0) {
        baseQuery.brndId = { $in: brandIds };
      }
    }

    const categories = req.query.categories ? req.query.categories.split(',') : [];
    if (categories.length > 0) {
      const categoryDocs = await Category.find({ name: { $in: categories }, dlt_sts: 0 });
      const categoryIds = categoryDocs.map(c => c.catId);
      if (categoryIds.length > 0) {
        baseQuery.catId = { $in: categoryIds };
      }
    }

    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    const matchStage = {
      ...baseQuery,
      $expr: {
        $and: [
          {
            $gte: [
              {
                $cond: [
                  { $eq: ["$showDiscount", 1] },
                  {
                    $subtract: [
                      "$price",
                      { $multiply: ["$price", { $divide: ["$discount", 100] }] }
                    ]
                  },
                  "$price"
                ]
              },
              minPrice
            ]
          },
          {
            $lte: [
              {
                $cond: [
                  { $eq: ["$showDiscount", 1] },
                  {
                    $subtract: [
                      "$price",
                      { $multiply: ["$price", { $divide: ["$discount", 100] }] }
                    ]
                  },
                  "$price"
                ]
              },
              maxPrice
            ]
          }
        ]
      }
    };

    const result = await Product.aggregate([
      { $match: matchStage },
      {
        $project: {
          avgRtng: 1,
          ratingGroup: {
            $switch: {
              branches: [
                { case: { $gte: ["$avgRtng", 4.5] }, then: 5 },
                { case: { $gte: ["$avgRtng", 3.5] }, then: 4 },
                { case: { $gte: ["$avgRtng", 2.5] }, then: 3 },
                { case: { $gte: ["$avgRtng", 1.5] }, then: 2 },
                { case: { $gte: ["$avgRtng", 0.5] }, then: 1 }
              ],
              default: null
            }
          }
        }
      },
      {
        $match: { ratingGroup: { $ne: null } } // exclude nulls
      },
      {
        $group: {
          _id: "$ratingGroup",
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.forEach(entry => {
      breakdown[entry._id] = entry.count;
    });

    res.json({ ratingCounts: breakdown });

  } catch (error) {
    console.error('Rating breakdown error:', error);
    res.status(500).json({ message: 'Server error while fetching rating stats' });
  }
};

export const getProductsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['trending', 'featured'].includes(type)) {
      return res.status(400).json({ message: 'Invalid product type' });
    }

    const products = await Product.find({
      prdType: type,
      dlt_sts: { $ne: 1 }
    })
      .sort({ createdOn: -1 })
      .limit(12);

    res.json({ products });
  } catch (error) {
    console.error(`Error fetching ${req.params.type} products:`, error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};


export const searchProducts = async (req, res) => {
  try {
    const {
      q = '',
      brands = '',
      categories = '',
      rating,
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      sortBy = 'default',
      limit = 12,
      page = 1,
      prdType
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Step 1: Build base query
    const baseQuery = await buildSearchFilter({ q, brands, categories, prdType });

    // ✅ Step 2: Get price stats BEFORE filtering by price
    const priceStats = await Product.aggregate([
      { $match: baseQuery },
      {
        $addFields: {
          effectivePrice: {
            $cond: [
              { $eq: ["$showDiscount", 1] },
              {
                $subtract: ["$price", { $multiply: ["$price", { $divide: ["$discount", 100] }] }]
              },
              "$price"
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$effectivePrice" },
          maxPrice: { $max: "$effectivePrice" }
        }
      }
    ]);

    const minPriceValue = priceStats[0]?.minPrice || 0;
    const maxPriceValue = priceStats[0]?.maxPrice || 1000;

    // ✅ Step 3: Apply price filter
    const priceFilteredQuery = buildPriceFilter(baseQuery, parseFloat(minPrice), parseFloat(maxPrice));

    // ✅ Step 4: Apply rating filter
    const finalQuery = buildRatingFilter(priceFilteredQuery, parseInt(rating), sortBy, req.query.ratingFilterMode || 'range');

    // ✅ Step 5: Fetch products
    const [products, totalCount] = await Promise.all([
      Product.find(finalQuery)
        .skip(skip)
        .limit(parseInt(limit))
        .sort(getSortCriteria(sortBy)),
      Product.countDocuments(finalQuery),
    ]);

    res.json({
      products,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      minPrice: minPriceValue,
      maxPrice: maxPriceValue
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
};