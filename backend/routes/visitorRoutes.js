const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');

// Helper to detect device type from user agent
const getDeviceType = (userAgent) => {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
        return 'mobile';
    }
    if (/ipad|tablet/i.test(ua)) {
        return 'tablet';
    }
    return 'desktop';
};

// Helper to extract browser name from user agent
const getBrowserName = (userAgent) => {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    return 'Other';
};

// Track a visitor (called on page load)
router.post('/track', async (req, res) => {
    try {
        const { page, referrer, sessionId } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || '';

        // Check if this is a unique visitor (by session or IP in last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingVisitor = await Visitor.findOne({
            $or: [
                { sessionId: sessionId },
                { ipAddress: ipAddress, createdAt: { $gte: oneDayAgo } }
            ]
        });

        const isUnique = !existingVisitor;

        const visitor = new Visitor({
            ipAddress,
            userAgent,
            page: page || '/',
            referrer: referrer || '',
            sessionId: sessionId || '',
            device: getDeviceType(userAgent),
            browser: getBrowserName(userAgent),
            isUnique
        });

        await visitor.save();

        res.status(201).json({
            success: true,
            message: 'Visit tracked',
            isUnique
        });
    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({ success: false, message: 'Error tracking visitor' });
    }
});

// Get visitor statistics (for admin dashboard)
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Total visitors
        const totalVisitors = await Visitor.countDocuments();

        // Unique visitors (only count unique ones)
        const uniqueVisitors = await Visitor.countDocuments({ isUnique: true });

        // Today's visitors
        const todayVisitors = await Visitor.countDocuments({
            createdAt: { $gte: today }
        });

        // This month's visitors
        const thisMonthVisitors = await Visitor.countDocuments({
            createdAt: { $gte: thisMonth }
        });

        // Last month's visitors (for comparison)
        const lastMonthVisitors = await Visitor.countDocuments({
            createdAt: { $gte: lastMonth, $lt: thisMonth }
        });

        // Calculate percentage change
        let percentChange = 0;
        if (lastMonthVisitors > 0) {
            percentChange = Math.round(((thisMonthVisitors - lastMonthVisitors) / lastMonthVisitors) * 100);
        }

        res.json({
            success: true,
            stats: {
                total: totalVisitors,
                unique: uniqueVisitors,
                today: todayVisitors,
                thisMonth: thisMonthVisitors,
                lastMonth: lastMonthVisitors,
                percentChange
            }
        });
    } catch (error) {
        console.error('Error getting visitor stats:', error);
        res.status(500).json({ success: false, message: 'Error getting visitor stats' });
    }
});

module.exports = router;
