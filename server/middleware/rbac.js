const ApiError = require('../utils/ApiError');

// Role-based access control middleware
// Usage: authorize('admin') or authorize('admin', 'member')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not authorized to access this resource`)
      );
    }

    next();
  };
};

module.exports = { authorize };
