const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codereview');

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection errors after initial connection
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        // Handle when the connection is disconnected
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // If the Node process ends, close the MongoDB connection
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Connect to MongoDB
connectDB();

module.exports = connectDB; 