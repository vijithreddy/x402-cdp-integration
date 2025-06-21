#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

console.log('🚀 Setting up X402 CDP Integration...');

// Copy OpenAI keys to AI service
const envPath = path.join(process.cwd(), '.env');
const aiEnvPath = path.join(process.cwd(), 'ai', '.env');

if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = dotenv.parse(envContent);
        
        // Filter only OpenAI keys
        const openaiKeys = Object.keys(envVars).filter(key => key.startsWith('OPENAI_'));
        const aiEnvContent = openaiKeys.map(key => `${key}=${envVars[key]}`).join('\n');
        
        if (aiEnvContent) {
            fs.writeFileSync(aiEnvPath, aiEnvContent);
            console.log('✅ OpenAI keys copied to ai/.env');
        } else {
            console.log('⚠️ No OpenAI keys found in .env');
        }
    } catch (error) {
        console.error('❌ Error copying OpenAI keys:', error.message);
    }
} else {
    console.log('⚠️ No .env file found in root');
}

// Copy .env files to language folders
try {
    if (fs.existsSync(envPath)) {
        fs.copyFileSync(envPath, path.join(process.cwd(), 'typescript', '.env'));
        fs.copyFileSync(envPath, path.join(process.cwd(), 'python', '.env'));
        console.log('✅ .env files copied to language folders');
    }
} catch (error) {
    console.error('❌ Error copying .env files:', error.message);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
    console.log('Installing TypeScript dependencies...');
    spawn('npm', ['run', 'setup:ts'], { stdio: 'inherit' });
    
    console.log('Installing Python dependencies...');
    spawn('npm', ['run', 'py:setup'], { stdio: 'inherit' });
    
    console.log('Installing AI service dependencies...');
    spawn('npm', ['run', 'ai:setup'], { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
}

console.log('\n✅ Setup complete!');
console.log('');
console.log('🚀 Quick Start Commands:');
console.log('  npm run setup          # One-time setup (you just ran this)');
console.log('  npm run ts:server      # Start TypeScript server');
console.log('  npm run py:server      # Start Python server');
console.log('  npm run ts:client      # Start TypeScript client');
console.log('  npm run py:client      # Start Python client');
console.log('');
console.log('🎯 AI Server:');
console.log('  npm run ai:server      # Start AI service (required for AI content)');
console.log('');
console.log('💡 Pro Tips:');
console.log('  - Run AI server first for full AI-powered content');
console.log('  - Use "npm run dev" to start all servers at once');
console.log('  - Check balance with "balance" command in client'); 