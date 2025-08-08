export const getSortCriteria = (sortBy = 'default') => {
  switch (sortBy) {
    case 'popularity':
    case 'rating':
      return { avgRtng: -1 }; // Higher ratings first
    case 'latest':
      return { createdOn: -1 }; // Newest first
    case 'avg-rating':
      return { avgRtng: -1 }; // Alias for rating
    case 'price-low':
      return { price: 1 };
    case 'price-high':
      return { price: -1 };
    default:
      return { createdOn: -1 }; // Default fallback
  }
};
