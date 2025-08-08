import Blog from '../models/Blog.js';

export const getPublicBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ sts: 1, dlt_sts: 0 })
      .sort({ publishDate: -1 })
      .select('heading image publishDate description') // show only public fields
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments({ sts: 1, dlt_sts: 0 });

    res.status(200).json({
      blogs,
      total: totalBlogs,
      page,
      totalPages: Math.ceil(totalBlogs / 6) // frontend displays 6 per page
    });
  } catch (err) {
    console.error('Public Blog List Error:', err);
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findOne({ _id: id, sts: 1, dlt_sts: 0 })
      .select('-__v -createdBy -createdIP -createdOn -updatedBy -updatedOn -deletedOn -dlt_sts -sts');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog);
  } catch (err) {
    console.error('Get Blog By ID Error:', err);
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
};

export const getTopBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ sts: 1, dlt_sts: 0 })
      .sort({ publishDate: -1 })
      .limit(3)
      .select('_id heading publishDate image');

    res.status(200).json(blogs);
  } catch (err) {
    console.error('Top Blogs Error:', err);
    res.status(500).json({ message: 'Failed to fetch top blogs' });
  }
};
