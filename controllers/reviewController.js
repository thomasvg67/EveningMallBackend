import LoginUser from '../models/LoginUser.js';
import RegisteredUser from '../models/RegisteredUser.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';

export const submitReview = async (req, res) => {
  try {
    const { PID, rating, review } = req.body;
    const userIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // Validate
    if (!PID || !rating || !review) {
      return res.status(400).json({ message: 'PID, rating, and review are required' });
    }

    const loginUser = await LoginUser.findById(req.user.userId);
    if (!loginUser) return res.status(401).json({ message: 'Invalid user' });

    const registeredUser = await RegisteredUser.findOne({ email: loginUser.email });
    const userName = registeredUser?.name || 'Unknown';

    const newReview = new Review({
      PID,
      rating,
      review,
      name: userName,
      createdBy: userName,
      createdIP: userIP,
    });

    await newReview.save();

    // Recalculate avg rating
    const reviews = await Review.find({ PID, dlt_sts: 0 });
    const avg = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    await Product.findOneAndUpdate(
      { PID },
      {
        avgRtng: avg.toFixed(2),
        reviewCount: reviews.length
      }
    );

    res.status(201).json({ message: 'Review submitted successfully', avgRating: avg });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

// Get all reviews for a product
export const getReviewsByPID = async (req, res) => {
  try {
    const PID = req.params.pid;
    const reviews = await Review.find({ PID, dlt_sts: 0 }).sort({ createdOn: -1 });
    res.json({ reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const getRatingBreakdown = async (req, res) => {
  try {
    const { pid } = req.params;

    if (!pid) return res.status(400).json({ message: 'Product ID is required' });

    const allReviews = await Review.find({ PID: pid, dlt_sts: 0 });

    const total = allReviews.length;

    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    allReviews.forEach((rev) => {
      const r = Math.floor(rev.rating);
      if (r >= 1 && r <= 5) {
        breakdown[r]++;
      }
    });

    const percentBreakdown = {};
    for (let star = 1; star <= 5; star++) {
      percentBreakdown[star] = total === 0 ? 0 : ((breakdown[star] / total) * 100).toFixed(1);
    }

    res.status(200).json({
      total,
      percentBreakdown, // e.g., {5: "40.0", 4: "30.0", ...}
    });
  } catch (error) {
    console.error('Breakdown Error:', error);
    res.status(500).json({ message: 'Failed to fetch breakdown' });
  }
};
