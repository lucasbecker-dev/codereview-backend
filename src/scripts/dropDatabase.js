const mongoose = require('mongoose');
require('dotenv').config();

async function dropDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('Connected to MongoDB. Dropping database...');
        const result = await mongoose.connection.dropDatabase();

        if (result) {
            console.log('✅ Database dropped successfully!');
        } else {
            console.log('❌ Failed to drop database.');
        }
    } catch (error) {
        console.error('Error dropping database:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    dropDatabase()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('Unhandled error:', error);
            process.exit(1);
        });
}

module.exports = dropDatabase; 