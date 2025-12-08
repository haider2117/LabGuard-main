// Script to reset database to clean state with only default admin
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'data', 'database.sqlite');
const uploadsPath = path.join(__dirname, '..', 'backend', 'data', 'uploads');

console.log('🗑️  Resetting database and cleaning uploads...\n');

// Delete database
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Database deleted');
} else {
    console.log('ℹ️  No existing database found');
}

// Clean uploads folder (keep .gitkeep)
if (fs.existsSync(uploadsPath)) {
    const files = fs.readdirSync(uploadsPath);
    let deletedCount = 0;
    
    files.forEach(file => {
        if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(uploadsPath, file));
            deletedCount++;
        }
    });
    
    if (deletedCount > 0) {
        console.log(`✅ Deleted ${deletedCount} uploaded file(s)`);
    } else {
        console.log('ℹ️  No uploaded files to delete');
    }
}

console.log('\n✅ Reset complete!\n');
console.log('Next steps:');
console.log('1. Run: npm run dev');
console.log('2. The app will create a fresh database');
console.log('3. Login with: admin / admin123\n');
console.log('📝 Fresh start: Only default admin user, no courses, exams, or users.');
