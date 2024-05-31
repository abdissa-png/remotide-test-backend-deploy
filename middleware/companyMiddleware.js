const isCompany = (req, res, next) => {
    // Check if the user is an admin
    if (req.user && req.user.role === 'company') {
        
        next(); // Allow the request to proceed
    } else {
        return res.status(403).json({
            status:"failed",
            message:'Access denied. company privileges required.'}
          );
        
    }
  };
  
  module.exports = isCompany;
  