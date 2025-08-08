import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

export const buildSearchFilter = async ({ q, brands, categories, prdType }) => {
  const searchRegex = new RegExp(q, 'i');

  const baseQuery = {
    dlt_sts: 0,
    $or: [
      { name: searchRegex },
      { tags: { $in: [searchRegex] } }
    ]
  };

  if (brands) {
    const brandList = brands.split(',');
    const brandDocs = await Brand.find({ name: { $in: brandList }, dlt_sts: 0 });
    const brandIds = brandDocs.map(b => b.brndId);
    if (brandIds.length > 0) baseQuery.brndId = { $in: brandIds };
  }

  if (categories) {
    const catList = categories.split(',');
    const categoryDocs = await Category.find({ name: { $in: catList }, dlt_sts: 0 });
    const catIds = categoryDocs.map(c => c.catId);
    if (catIds.length > 0) baseQuery.catId = { $in: catIds };
  }

  // ✅ 🔹 Filter by product type (ONLY IF DEFINED)
  if (prdType !== undefined) {
    baseQuery.prdType = prdType;
  }

  return baseQuery;
};

export const buildPriceFilter = (query, minPrice, maxPrice) => {
  return {
    ...query,
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
};

export const buildRatingFilter = (query, rating, sortBy, mode = 'range') => {
  if (!rating && sortBy !== 'avg-rating') return query;

  const ratingFilter = {};

  if (rating) {
    if (mode === 'range') {
      // Used in Shop page (e.g., filter only 4-star range: 4.0 to 4.9)
      ratingFilter.$gte = rating;
      ratingFilter.$lte = rating + 0.9;
    } else if (mode === 'min') {
      // Used in Bestseller page (e.g., rating >= 4)
      ratingFilter.$gte = rating;
    }
  }

  // Special handling if sort is 'avg-rating' (no change here)
  if (sortBy === 'avg-rating') {
    ratingFilter.$gte = Math.max(ratingFilter.$gte || 2.0, 2.0);
    ratingFilter.$lte = Math.min(ratingFilter.$lte || 4.0, 4.0);
    ratingFilter.$ne = null;
  }

  return {
    ...query,
    avgRtng: ratingFilter
  };
};

