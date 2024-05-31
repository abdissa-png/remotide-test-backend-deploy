const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require("./../config")

const auth = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token)
        return res.status(401).json({
            status:'failed',
            message:'Access denied. No token provided.'}
);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status:'failed',
            message:'Access token expired.'});
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({
                status:'failed',
            message:'Invalid token.'});
        } else {
            return res.status(500).json({
                status:'failed',
            message:'Internal Server Error.'});
        }
    }
};

module.exports = auth;
