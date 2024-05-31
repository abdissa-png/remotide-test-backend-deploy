
const isCompany = (req, res, next) => {
    // Check if the user is an admin
    if (req.user && req.user.role === 'talent') {
        next(); // Allow the request to proceed
    } else {
        return res.status(403).json({
            status:"failed",
            message:'Access denied. Talent privileges required.'}
          );
    }
  };
  
  module.exports = isCompany;
  