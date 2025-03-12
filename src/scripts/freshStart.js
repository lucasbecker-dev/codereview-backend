const { spawn } = require('child_process');
const dropDatabase = require('./dropDatabase');

async function freshStart() {
    try {
        // First drop the database
        await dropDatabase();

        console.log('\n🚀 Starting server with fresh database...\n');

        // Start the server using nodemon
        const nodemon = spawn('nodemon', ['src/app.js'], {
            stdio: 'inherit',
            shell: true
        });

        // Handle process exit
        nodemon.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
            process.exit(code);
        });

        // Handle process errors
        nodemon.on('error', (err) => {
            console.error('Failed to start server process:', err);
            process.exit(1);
        });

        // Handle SIGINT (Ctrl+C) to properly close the child process
        process.on('SIGINT', () => {
            nodemon.kill('SIGINT');
        });

    } catch (error) {
        console.error('Error in fresh start:', error);
        process.exit(1);
    }
}

// Run the function
freshStart(); 