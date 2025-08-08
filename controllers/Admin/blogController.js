import Blog from '../../models/Blog.js';
import LoginUser from '../../models/LoginUser.js';
import RegisteredUser from '../../models/RegisteredUser.js';

export const createBlog = async (req, res) => {
  try {
    const { name, heading, description, tags, categories, publishDate } = req.body;
    const userId = req.user?.userId;
    const image = req.files?.['image']?.[0]?.path;
    const createdIP = req.ip;

    if (!image) return res.status(400).json({ message: 'Main image is required' });

    const loginUser = await LoginUser.findById(userId);
    if (!loginUser || loginUser.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const regUser = await RegisteredUser.findOne({ email: loginUser.email });
    const createdBy = regUser?.name || 'Unknown Admin';

    const blog = new Blog({
      name,
      heading,
      description,
      tags: JSON.parse(tags),
      categories: JSON.parse(categories),
      publishDate: publishDate ? new Date(publishDate) : null,
      image,
      createdBy,
      createdIP,
      sts: 0, // default draft
      createdOn: new Date()
    });

    await blog.save();
    res.status(201).json({ message: 'Blog created in draft mode', blog });
  } catch (err) {
    console.error('Create Blog Error:', err);
    res.status(500).json({ message: 'Server error creating blog' });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ dlt_sts: 0 }).sort({ createdOn: -1 });
    res.status(200).json({ blogs });
  } catch (err) {
    console.error('Get Blogs Error:', err);
    res.status(500).json({ message: 'Server error fetching blogs' });
  }
};

export const toggleBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.sts = blog.sts === 1 ? 0 : 1;
    blog.updatedOn = new Date();
    await blog.save();

    res.status(200).json({ message: `Blog ${blog.sts === 1 ? 'published' : 'unpublished'}`, blog });
  } catch (err) {
    console.error('Toggle Status Error:', err);
    res.status(500).json({ message: 'Server error toggling blog status' });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, heading, description, tags, categories, publishDate } = req.body;
    const image = req.files?.['image']?.[0]?.path;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (name !== undefined) blog.name = name;
    if (heading !== undefined) blog.heading = heading;
    if (description !== undefined) blog.description = description;
    if (tags !== undefined) blog.tags = JSON.parse(tags);
    if (categories !== undefined) blog.categories = JSON.parse(categories);
    if (publishDate) blog.publishDate = new Date(publishDate);
    if (image) blog.image = image;

    blog.updatedOn = new Date();
    await blog.save();

    res.status(200).json({ message: 'Blog updated', blog });
  } catch (err) {
    console.error('Update Blog Error:', err);
    res.status(500).json({ message: 'Server error updating blog' });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.dlt_sts = 1;
    blog.deletedOn = new Date();
    await blog.save();

    res.status(200).json({ message: 'Blog deleted (soft)' });
  } catch (err) {
    console.error('Delete Blog Error:', err);
    res.status(500).json({ message: 'Server error deleting blog' });
  }
};
