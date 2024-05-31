const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    discount_percentage: {
        type: Number,
        required: true
    },
    created_date: {
        type: Date,
        default: Date.now
    }
});

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
