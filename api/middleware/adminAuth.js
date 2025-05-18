const { auth } = require('./auth');

const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await auth(req, res, () => {});

    // Then check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Please authenticate.',
      error: error.message 
    });
  }
};

module.exports = { adminAuth }; 