// Script to clear all visitor records from the database
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Visitor = require('../models/Visitor');

const clearVisitors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Count existing visitors
        const count = await Visitor.countDocuments();
        console.log(`Found ${count} visitor records`);

        // Delete all visitors
        const result = await Visitor.deleteMany({});
        console.log(`Deleted ${result.deletedCount} visitor records`);

        // Disconnect
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        console.log('Done! Visitor collection has been cleared.');
    } catch (error) {
        console.error('Error clearing visitors:', error);
        process.exit(1);
    }
};

clearVisitors();
