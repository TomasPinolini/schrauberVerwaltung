// test.js: Test function.js with all payloads in one_payload and print the resulting SQL query
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load the function.js logic as a function
const vm = require('vm');
const functionJs = fs.readFileSync(path.join(__dirname, 'function.js'), 'utf-8');

// Wrap the function.js code in a function for the VM
defaultWrapper = `\n(function() {\n${functionJs}\n}).call(this);\n`;

// List all payload files
const payloadDir = path.join(__dirname, 'one_payload');
const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));

// Command line select option
const arg = process.argv[2];

if (arg === 'select') {
    // Interactive mode: go one by one
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let i = 0;
    function showNext() {
        if (i >= files.length) {
            rl.close();
            return;
        }
        const filename = files[i];
        const payload = JSON.parse(fs.readFileSync(path.join(payloadDir, filename), 'utf-8'));
        const msg = { payload };
        const sandbox = { msg, Buffer, console };
        vm.createContext(sandbox);
        vm.runInContext(defaultWrapper, sandbox);
        console.log('--- ' + filename + ' ---');
        console.log(sandbox.msg.topic);
        console.log();
        rl.question('Press Enter for next, or type q to quit: ', (answer) => {
            if (answer.trim().toLowerCase() === 'q') {
                rl.close();
                return;
            }
            i++;
            showNext();
        });
    }
    showNext();
} else {
    // Default: show all
    console.log('Testing all payloads in one_payload...\n');
    files.forEach(filename => {
        const payload = JSON.parse(fs.readFileSync(path.join(payloadDir, filename), 'utf-8'));
        const msg = { payload };
        // Run the function.js code in a sandbox
        const sandbox = { msg, Buffer, console };
        vm.createContext(sandbox);
        vm.runInContext(defaultWrapper, sandbox); // Use wrapped code
        console.log('--- ' + filename + ' ---');
        console.log(sandbox.msg.topic); // Print the resulting SQL query
        console.log();
    });
}node data/test.js select