const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initDb() {
    try {
        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, '../../schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`schema.sql not found at path: ${schemaPath}`);
        }
        
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');

        // Split queries by semicolon ending on a line
        const queries = sqlContent
            .split(/;\s*$/m)
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Connecting to database and executing ${queries.length} queries...`);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            
            // Clean up comments at the start of queries
            const cleanQuery = query
                .split('\n')
                .filter(line => !line.trim().startsWith('--'))
                .join('\n')
                .trim();
                
            if (!cleanQuery) continue;

            console.log(`Executing query ${i + 1}/${queries.length}...`);
            await pool.query(cleanQuery);
        }

        console.log('\n===========================================');
        console.log('✅ DATABASE INITIALIZED SUCCESSFULLY!');
        console.log('Default Admin Account Created:');
        console.log('Phone: 0911111111');
        console.log('Password: admin123');
        console.log('===========================================');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during database initialization:', error.message);
        process.exit(1);
    }
}

initDb();
