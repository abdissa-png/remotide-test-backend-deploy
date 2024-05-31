const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("./../config")
const JobPosting = require('../models/jobModel');
const AppError = require('../helpers/appError');

const isowncompany = (req, res, next) => {
    // Check if the user is an admin
    const token = req.header('auth-token');
    
    
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log(req.user.userId)
        console.log(req.body.company_id)
        
        if (req.user.userId == req.body.company_id) {
            next(); // Allow the request to proceed
        } else {
            return res.status(403).json({
                status: "failed",
                message: 'Access denied. You cannot access it.'
            });
        }
    
};
const isownprofile = (req, res, next) => {
    // Check if the user is an admin
    const token = req.header('auth-token');
    
    
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log(req.user.userId)
        console.log(req.body.company_id)
        
        if (req.user.userId == req.body.company_id) {
            next(); // Allow the request to proceed
        } else {
            return res.status(403).json({
                status: "failed",
                message: 'Access denied. You cannot access it.'
            });
        }
    
};
const company_can_delete = async (req, res, next) => {
    
    const token = req.header('auth-token');
    
    
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log(req.user.userId)
        const data = req.params.id;
         
        const document = await JobPosting.findOne({_id:data})
          if(!document){
            return next(new AppError('No user data available for the given ID', 400));
          }
        
        if (req.user.userId == document.company_id) {
            next(); // Allow the request to proceed
        } else {
            return res.status(403).json({
                status: "failed",
                message: 'Access denied. You cannot delete it.'
            });
        }
    
};

module.exports={
    isowncompany,
    isownprofile,
    company_can_delete
} 
