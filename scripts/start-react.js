// Helper script to start React with correct port on Windows
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

console.log('🚀 Starting React dev server on port 3001...\n');

// Use cross-env to set environment variables reliably on Windows
// BROWSER is read from .env file - set to 'chrome' to open browser, 'none' to disable
const reactScripts = spawn('npx', [
    'cross-env',
    'PORT=3001',
    'react-scripts',
    'start'
], {
    cwd: path.join(__dirname, '..', 'frontend'),
    stdio: 'pipe',
    shell: true
});

let serverStarted = false;

reactScripts.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    // Look for port in output
    const portMatch = output.match(/localhost:(\d+)/);
    if (portMatch) {
        console.log(`\n🔍 DETECTED: React is using port ${portMatch[1]}\n`);
    }
    
    // When compiled, test if server is responding
    if ((output.includes('webpack compiled') || output.includes('No issues found')) && !serverStarted) {
        serverStarted = true;
        console.log('\n🔍 React compiled! Testing if server is responding...\n');
        
        setTimeout(() => {
            http.get('http://127.0.0.1:3001', (res) => {
                console.log(`✅ SUCCESS! Dev server is responding on port 3001 (status: ${res.statusCode})\n`);
            }).on('error', (err) => {
                console.log(`⚠️  WARNING: Server not responding on port 3001 (${err.code})`);
                console.log('   React compiled but dev server may not have started.\n');
            });
        }, 2000);
    }
});

reactScripts.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
});

reactScripts.on('error', (err) => {
    console.error('❌ Failed to start React:', err);
    process.exit(1);
});

reactScripts.on('exit', (code) => {
    console.log(`React dev server exited with code ${code}`);
    process.exit(code);
});
