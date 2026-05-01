const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    page: {
        type: String,
        trim: true,
        default: '/'
    },
    referrer: {
        type: String,
        trim: true
    },
    sessionId: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    device: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'unknown'
    },
    browser: {
        type: String,
        trim: true
    },
    isUnique: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ ipAddress: 1 });
visitorSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
