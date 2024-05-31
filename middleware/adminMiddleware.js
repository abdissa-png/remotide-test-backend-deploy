const isAdmin = (req, res, next) => {
  // Check if the user is an admin
  if (req.user && (req.user.role === 'admin' || req.user.role=="superadmin")) {
      next(); // Allow the request to proceed
  } else {
      return res.status(403).json({
        status:"failed",
        message:'Access denied. Admin privileges required.'}
      );
  }
};
const isSuperAdmin = (req, res, next) => {
  // Check if the user is an admin
  if (req.user && (req.user.role=="superadmin")) {
      next(); // Allow the request to proceed
  } else {
      return res.status(403).json({
        status:"failed",
        message:'Access denied. Super Admin privileges required.'}
      );
  }
};
module.exports = {
  isAdmin,
  isSuperAdmin
}
