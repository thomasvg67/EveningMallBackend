import Product from '../../models/Product.js';
import RegisteredUser from '../../models/RegisteredUser.js';
import LoginUser from '../../models/LoginUser.js';
import Brand from '../../models/Brand.js';
import Category from '../../models/Category.js';
import SubCategory from '../../models/SubCategory.js';
import { getSortCriteria } from '../../utils/sortHelper.js';

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, discount, quantity, brandName, categoryName, subCategoryName, prdType } = req.body;
    const userId = req.user?.userId;
    let rawTags = req.body.tags;

    let tags = [];
    if (Array.isArray(rawTags)) {
      tags = rawTags;
    } else if (typeof rawTags === 'string') {
      try {
        const parsed = JSON.parse(rawTags);
        tags = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        tags = [rawTags];
      }
    }

    // Get login user from token userId
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser || loginUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create products' });
    }

    // Get registered user using email (encrypted email matching logic if needed)
    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });

    const adminName = registeredUser?.name || 'Unknown Admin';

    const imgMain = req.files['imgMain']?.[0]?.path;
    const imgMulti = req.files['imgMulti']?.map(file => file.path);

    if (!name || !price || !quantity || !imgMain || !imgMulti || !brandName || !categoryName || !subCategoryName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (imgMulti.length !== 4) {
      return res.status(400).json({ message: 'Exactly 4 multi-images required' });
    }

    let brand = await Brand.findOne({ name: new RegExp(`^${brandName}$`, 'i'), dlt_sts: 0 });
    if (!brand) {
      brand = new Brand({ name: brandName, createdBy: adminName });
      await brand.save();
    }

    let category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i'), dlt_sts: 0 });
    if (!category) {
      category = new Category({ name: categoryName, createdBy: adminName });
      await category.save();
    }

    // Handle SubCategory (within this Category)
    let subCategory = await SubCategory.findOne({
      name: new RegExp(`^${subCategoryName}$`, 'i'),
      catId: category.catId,
      dlt_sts: 0
    });

    if (!subCategory) {
      subCategory = new SubCategory({
        name: subCategoryName,
        catId: category.catId,
        createdBy: adminName
      });
      await subCategory.save();
    }

    // Validate and sanitize HTML description if needed
    let htmlDescription = description || '';

    // Optional: Basic HTML validation (you might want to use a library like DOMPurify for server-side)
    if (htmlDescription.trim() === '') {
      htmlDescription = '<p>No description provided</p>';
    }
    // Enforce maximum 12 products for each type: 'featured' or 'trendy'
    if (['featured', 'trendy'].includes(prdType)) {
      const count = await Product.countDocuments({ prdType, dlt_sts: { $ne: 1 } });
      if (count >= 12) {
        return res.status(400).json({ message: `Only 12 ${prdType} products allowed.` });
      }
    }

    const newProduct = new Product({
      name,
      description: htmlDescription,
      price,
      discount,
      quantity,
      prdType,
      brndId: brand.brndId,
      catId: category.catId,
      subCatId: subCategory.subCatId,
      tags,
      imgMain,
      imgMulti,
      createdBy: adminName,
      createdOn: new Date(),
    });

    await newProduct.save();

    res.status(201).json({ message: 'Product created', product: newProduct });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

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

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, discount, quantity, brandName, categoryName, subCategoryName, retainedMultiImages = [], tags, prdType, } = req.body;
    const pid = req.params.pid;
    const userId = req.user?.userId;

    // Validate login user (must be admin)
    const loginUser = await LoginUser.findById(userId);
    if (!loginUser || loginUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update products' });
    }

    // Get admin name from registered user
    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    const adminName = registeredUser?.name || 'Unknown Admin';

    // Fetch product by PID
    const product = await Product.findOne({ PID: pid });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Check limit for 'featured' or 'trendy' prdType
    if (['featured', 'trending'].includes(prdType)) {
      const existingCount = await Product.countDocuments({
        prdType,
        PID: { $ne: pid }, // Exclude current product
        dlt_sts: { $ne: 1 }
      });

      if (existingCount >= 12) {
        return res.status(400).json({ message: `Only 12 ${prdType} products allowed.` });
      }
    }


    // Update basic fields
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (price) product.price = price;
    if (discount !== undefined) product.discount = discount;
    if (quantity) product.quantity = quantity;
    if (tags) { product.tags = Array.isArray(tags) ? tags : [tags]; }
    if (prdType !== undefined) { product.prdType = prdType; }

    // Handle brand update/creation
    if (brandName) {
      let brand = await Brand.findOne({ name: brandName, dlt_sts: 0 });
      if (!brand) {
        // Create new brand if it doesn't exist
        const maxBrandId = await Brand.findOne({}, {}, { sort: { brndId: -1 } });
        const newBrndId = maxBrandId ? maxBrandId.brndId + 1 : 1;

        brand = new Brand({
          brndId: newBrndId,
          name: brandName,
          createdBy: adminName,
          createdOn: new Date(),
          dlt_sts: 0
        });
        await brand.save();
      }
      product.brndId = brand.brndId;
    }


    // Handle category update/creation
    if (categoryName) {
      let category = await Category.findOne({ name: categoryName, dlt_sts: 0 });
      if (!category) {
        // Create new category if it doesn't exist
        const maxCatId = await Category.findOne({}, {}, { sort: { catId: -1 } });
        const newCatId = maxCatId ? maxCatId.catId + 1 : 1;

        category = new Category({
          catId: newCatId,
          name: categoryName,
          createdBy: adminName,
          createdOn: new Date(),
          dlt_sts: 0
        });
        await category.save();
      }
      product.catId = category.catId;
    }


    // Handle subcategory update/creation
    if (subCategoryName && categoryName) {
      // First ensure we have the category
      const category = await Category.findOne({ name: categoryName, dlt_sts: 0 });
      if (category) {
        let subCategory = await SubCategory.findOne({
          name: subCategoryName,
          catId: category.catId,
          dlt_sts: 0
        });

        if (!subCategory) {
          // Create new subcategory if it doesn't exist
          const maxSubCatId = await SubCategory.findOne({}, {}, { sort: { subCatId: -1 } });
          const newSubCatId = maxSubCatId ? maxSubCatId.subCatId + 1 : 1;

          subCategory = new SubCategory({
            subCatId: newSubCatId,
            name: subCategoryName,
            catId: category.catId,
            createdBy: adminName,
            createdOn: new Date(),
            dlt_sts: 0
          });
          await subCategory.save();
        }
        product.subCatId = subCategory.subCatId;
      }
    }



    // Update imgMain if new file is provided
    if (req.files['imgMain'] && req.files['imgMain'][0]) {
      product.imgMain = req.files['imgMain'][0].path;
    }

    // Handle retained multi images (from frontend JSON string or array)
    let updatedMultiImages = [];
    if (typeof retainedMultiImages === 'string') {
      try {
        updatedMultiImages = JSON.parse(retainedMultiImages);
      } catch (e) {
        updatedMultiImages = [];
      }
    } else if (Array.isArray(retainedMultiImages)) {
      updatedMultiImages = retainedMultiImages;
    }

    // Add new uploaded multi images
    if (req.files['imgMulti'] && req.files['imgMulti'].length > 0) {
      const uploadedPaths = req.files['imgMulti'].map(file => file.path);
      updatedMultiImages = [...updatedMultiImages, ...uploadedPaths];
    }

    // Save updated multi image paths
    if (updatedMultiImages.length > 0) {
      product.imgMulti = updatedMultiImages;
    }

    // Update metadata
    product.updatedBy = adminName;
    product.updatedOn = new Date();

    await product.save();

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const pid = req.params.pid;
    const userId = req.user?.userId;

    const loginUser = await LoginUser.findById(userId);
    if (!loginUser || loginUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete products' });
    }

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    const adminName = registeredUser?.name || 'Unknown Admin';

    const product = await Product.findOne({ PID: pid });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.dlt_sts = 1;
    product.deletedBy = adminName;
    product.deletedOn = new Date();

    await product.save();

    res.status(200).json({ message: 'Product marked as deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const checkPrdTypeCount = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || !['trending', 'featured'].includes(type)) {
      return res.status(400).json({ message: 'Invalid or missing product type' });
    }

    const count = await Product.countDocuments({ prdType: type, dlt_sts: { $ne: 1 } });
    res.json({ count });
  } catch (error) {
    console.error('Error checking product type count:', error);
    res.status(500).json({ message: 'Server error while checking product type count' });
  }
};

export const toggleShowDiscount = async (req, res) => {
  try {
    const pid = req.params.pid;
    const { show } = req.body; // expecting 0 or 1

    const product = await Product.findOne({ PID: pid });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.showDiscount = show === 1 ? 1 : 0;
    await product.save();

    res.status(200).json({ message: 'ShowDiscount updated', product });
  } catch (error) {
    console.error('Error toggling ShowDiscount:', error);
    res.status(500).json({ message: 'Server error' });
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

export const saveCustomHtml = async (req, res) => {
  try {
    const { htmlCode } = req.body;
    const updated = await Product.findOneAndUpdate(
      { PID: req.params.pid },
      { customHTML: htmlCode },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Custom HTML saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const search = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const searchRegex = new RegExp(search, 'i');

    // Build base query (without price filtering yet)
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


    // 🔥 Calculate min/max price **based only on brand + search filters**
    const priceStats = await Product.aggregate([
      { $match: baseQuery },
      {
        $addFields: {
          effectivePrice: {
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

    const minPrice = priceStats[0]?.minPrice || 0;
    const maxPrice = priceStats[0]?.maxPrice || 1000;

    // Now add price filter separately (for actual product listing)
    const minPriceFilter = parseFloat(req.query.minPrice) || 0;
    const maxPriceFilter = parseFloat(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;

    const finalQuery = {
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
              minPriceFilter
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
              maxPriceFilter
            ]
          }
        ]
      }
    };
    const selectedRating = parseInt(req.query.rating);
    if (selectedRating) {
      let min = 0, max = 5;
      switch (selectedRating) {
        case 5:
          min = 5.0; max = 5.9;
          break;
        case 4:
          min = 4.0; max = 4.9;
          break;
        case 3:
          min = 3.0; max = 3.9;
          break;
        case 2:
          min = 2.0; max = 2.9;
          break;
        case 1:
          min = 1.0; max = 1.9;
          break;
      }

      finalQuery.avgRtng = { $gte: min, $lte: max };
    }

    const sortBy = req.query.sortBy || 'default';

    if (sortBy === 'avg-rating') {
      // Inject additional range filter (avgRtng between 2.0 and 4.0)
      if (finalQuery.avgRtng) {
        // Merge if already filtering by avgRtng from selectedRating
        finalQuery.avgRtng = {
          $gte: Math.max(finalQuery.avgRtng.$gte || 0, 2.0),
          $lte: Math.min(finalQuery.avgRtng.$lte || 5, 4.0)
        };
      } else {
        finalQuery.avgRtng = { $gte: 2.0, $lte: 4.0 };
      }
      finalQuery.avgRtng.$ne = null;
    }

    const [products, totalCount] = await Promise.all([
      Product.find(finalQuery)
        .skip(skip)
        .limit(limit)
        .sort(getSortCriteria(sortBy)),
      Product.countDocuments(finalQuery),
    ]);

    res.json({
      products,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      currentPage: page,
      minPrice,
      maxPrice
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
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