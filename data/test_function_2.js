// Usage: node test_function_2.js <payload.json>
const fs = require('fs');
const path = require('path');
const { function_2 } = require('./function_2');

if (process.argv.length < 3) {
    console.log('Usage: node test_function_2.js <payload.json>');
    process.exit(1);
}

const filePath = path.resolve(process.argv[2]);

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Failed to read file:', err.message);
        process.exit(2);
    }
    let payload;
    try {
        payload = JSON.parse(data);
    } catch (e) {
        console.error('Invalid JSON:', e.message);
        process.exit(3);
    }
    const result = function_2(payload);
    console.log('--- SQL QUERY ---');
    console.log(result.sql);
    console.log('\n--- MISSING FIELDS ANALYSIS ---');
    console.log(JSON.stringify(result.analysis, null, 2));
});
