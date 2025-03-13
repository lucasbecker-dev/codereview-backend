const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options help with connection stability
            serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Add connection error handlers
        mongoose.connection.on('error', err => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Handle application termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        // Don't exit the process in test environment
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        throw error; // Re-throw for test environments
    }
};

module.exports = connectDB; 