const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function executeCommand(command, errorMessage) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error: ${errorMessage}`);
        console.error(error);
        process.exit(1);
    }
}

async function setup() {
    console.log('🚀 Setting up Privacy-Preserving Voting System...');

    // Check if .env exists
    if (!fs.existsSync('.env')) {
        console.log('📝 Creating .env file from .env.example');
        fs.copyFileSync('.env.example', '.env');
        console.log('⚠️ Please fill in your environment variables in .env');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    executeCommand('npm install', 'Failed to install npm dependencies');

    // Build Cairo contracts
    console.log('🏗️ Building Cairo contracts...');
    executeCommand('scarb build', 'Failed to build Cairo contracts');

    // Setup frontend
    console.log('🎨 Setting up frontend...');
    if (!fs.existsSync('node_modules')) {
        executeCommand('npm install', 'Failed to install frontend dependencies');
    }

    console.log('✨ Setup completed successfully!');
    console.log(`
Next steps:
1. Fill in your environment variables in .env
2. Run 'npm run dev' to start the development server
3. Visit http://localhost:3000 to access the application
    `);
}

setup().catch(console.error);
