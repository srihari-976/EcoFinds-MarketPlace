#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up EcoFinds project...\n');

// Create environment files
const backendEnv = `# Environment Variables for EcoFinds Backend

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=ecofinds_super_secret_key_2025_change_in_production
JWT_EXPIRES_IN=24h

# Database Configuration
DB_PATH=./ecofinds.db

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=10`;

const frontendEnv = `# Frontend Environment Variables
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development`;

// Write environment files
fs.writeFileSync(path.join(__dirname, 'ecofinds-backend', '.env'), backendEnv);
fs.writeFileSync(path.join(__dirname, 'ecofinds-frontend', '.env'), frontendEnv);

console.log('✅ Environment files created');

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'ecofinds-backend'), stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install backend dependencies:', error.message);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
try {
  execSync('npm install', { cwd: path.join(__dirname, 'ecofinds-frontend'), stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies:', error.message);
}

console.log('\n🎉 Setup complete!');
console.log('\nTo start the application:');
console.log('1. Start backend: cd ecofinds-backend && npm run dev');
console.log('2. Start frontend: cd ecofinds-frontend && npm start');
console.log('\nTo add sample data:');
console.log('3. Seed database: cd ecofinds-backend && node seed-data.js');
console.log('\nThe application will be available at:');
console.log('- Frontend: http://localhost:3000');
console.log('- Backend API: http://localhost:3001');
console.log('\n🔑 Test Credentials (after seeding):');
console.log('Email: alice@example.com | Password: password123');
console.log('Email: bob@example.com | Password: password123');
console.log('Email: charlie@example.com | Password: password123');
