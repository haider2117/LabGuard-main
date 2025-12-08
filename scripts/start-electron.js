// Helper script to start Electron after React is ready
const http = require('http');
const { spawn } = require('child_process');

console.log('⏳ Waiting for React dev server on http://localhost:3001...');

let attempts = 0;
const maxAttempts = 60; // 60 seconds timeout

function checkServer() {
    attempts++;
    
    // Use 127.0.0.1 explicitly instead of localhost to avoid IPv6 issues
    const options = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/',
        family: 4 // Force IPv4
    };
    
    http.get(options, (res) => {
        if (res.statusCode === 200) {
            console.log('✅ React dev server is ready!');
            console.log('   Status:', res.statusCode);
            console.log('🚀 Starting Electron...\n');
            
            // Start Electron
            const electron = spawn('electron', ['.'], {
                stdio: 'inherit',
                shell: true
            });
            
            electron.on('error', (err) => {
                console.error('❌ Failed to start Electron:', err);
                process.exit(1);
            });
            
            electron.on('exit', (code) => {
                console.log(`Electron exited with code ${code}`);
                process.exit(code);
            });
        } else {
            console.log(`   Server responded with status ${res.statusCode}, retrying...`);
            retryCheck();
        }
    }).on('error', (err) => {
        if (attempts >= maxAttempts) {
            console.error('❌ Timeout: React dev server did not start within 60 seconds');
            console.error('   Error:', err.message);
            console.error('   Make sure React is running on port 3001');
            console.error('\n   Try running in separate terminals:');
            console.error('   Terminal 1: npm run dev:react');
            console.error('   Terminal 2: npm run test-react');
            process.exit(1);
        } else {
            if (attempts === 1 || attempts % 10 === 0) {
                console.log(`   Connection error: ${err.code || err.message}`);
            }
            retryCheck();
        }
    });
}

function retryCheck() {
    if (attempts % 5 === 0) {
        console.log(`   Still waiting... (${attempts}s)`);
    }
    setTimeout(checkServer, 1000);
}

checkServer();
