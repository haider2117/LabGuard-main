// Manual rebuild script for better-sqlite3
const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Rebuilding better-sqlite3 for Electron...\n');

const electronVersion = '38.7.2';
const modulePath = path.join(__dirname, '..', 'node_modules', 'better-sqlite3');

try {
    console.log(`Electron version: ${electronVersion}`);
    console.log(`Module path: ${modulePath}\n`);
    
    // Change to module directory and rebuild
    process.chdir(modulePath);
    
    console.log('Running npm run build-release...');
    execSync('npm run build-release', {
        stdio: 'inherit',
        env: {
            ...process.env,
            npm_config_target: electronVersion,
            npm_config_arch: 'x64',
            npm_config_target_arch: 'x64',
            npm_config_disturl: 'https://electronjs.org/headers',
            npm_config_runtime: 'electron',
            npm_config_build_from_source: 'true'
        }
    });
    
    console.log('\n✅ Rebuild complete!');
} catch (error) {
    console.error('\n❌ Rebuild failed:', error.message);
    process.exit(1);
}
