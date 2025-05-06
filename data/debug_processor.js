/**
 * Debug Processor for Schrauber Data
 * 
 * This script helps diagnose issues with a specific processor by providing
 * detailed error information.
 * 
 * Usage: node debug_processor.js <controller_name> [sample_index]
 * 
 * Example: node debug_processor.js MFV3_Halle204_Vorm_Prop_Druck 0
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

// Get command line arguments
const controllerName = process.argv[2];
const sampleIndex = parseInt(process.argv[3] || '0', 10);

if (!controllerName) {
  console.error('Usage: node debug_processor.js <controller_name> [sample_index]');
  console.error('Example: node debug_processor.js MFV3_Halle204_Vorm_Prop_Druck 0');
  process.exit(1);
}

// Paths
const ALL_DATA_DIR = path.join(__dirname, 'all_data');
const ONE_PAYLOAD_DIR = path.join(__dirname, 'one_payload');
const PROCESSORS_DIR = path.join(__dirname, 'data_handling', 'live');

// Find the processor file
const processorFile = path.join(PROCESSORS_DIR, `process_${controllerName}.js`);
if (!fs.existsSync(processorFile)) {
  console.error(`Processor file not found: ${processorFile}`);
  process.exit(1);
}

// Find the sample file
let sampleFile;
const allDataFiles = fs.readdirSync(ALL_DATA_DIR)
  .filter(file => file.includes(controllerName));

if (allDataFiles.length > 0) {
  sampleFile = path.join(ALL_DATA_DIR, allDataFiles[0]);
} else {
  // Try one_payload directory
  const onePayloadFiles = fs.readdirSync(ONE_PAYLOAD_DIR)
    .filter(file => file.includes(controllerName));
  
  if (onePayloadFiles.length > 0) {
    sampleFile = path.join(ONE_PAYLOAD_DIR, onePayloadFiles[0]);
  } else {
    console.error(`No sample file found for controller: ${controllerName}`);
    process.exit(1);
  }
}

console.log(`Using processor: ${processorFile}`);
console.log(`Using sample file: ${sampleFile}`);

// Read the sample data
let sampleData;
try {
  const content = fs.readFileSync(sampleFile, 'utf8');
  
  if (sampleFile.endsWith('.json')) {
    // JSON file - single object
    sampleData = JSON.parse(content);
    console.log(`Loaded JSON sample`);
  } else {
    // Text file - one JSON object per line
    const lines = content.split('\n').filter(line => line.trim());
    
    if (sampleIndex >= lines.length) {
      console.error(`Sample index ${sampleIndex} is out of range (0-${lines.length - 1})`);
      process.exit(1);
    }
    
    try {
      sampleData = JSON.parse(lines[sampleIndex]);
      console.log(`Loaded sample ${sampleIndex} of ${lines.length}`);
    } catch (e) {
      console.error(`Error parsing JSON at line ${sampleIndex}: ${e.message}`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error(`Error reading sample file: ${error.message}`);
  process.exit(1);
}

// Read the processor code
const processorCode = fs.readFileSync(processorFile, 'utf8');
console.log('\nProcessor code structure check:');

// Check for common issues in the processor code
if (processorCode.includes('try {') && !processorCode.includes('function')) {
  console.error('⚠️ WARNING: The try block appears to be at the top level, not inside a function.');
  console.error('   This can cause issues when running in the batch processor.');
}

// Create a mock node object for Node-RED environment
const nodeErrors = [];
const nodeWarnings = [];
const mockNode = {
  error: (msg) => {
    nodeErrors.push(msg);
    console.error(`NODE ERROR: ${msg}`);
  },
  warn: (msg) => {
    nodeWarnings.push(msg);
    console.warn(`NODE WARNING: ${msg}`);
  }
};

// Create a sandbox environment to run the processor
const sandbox = {
  console: console,
  Buffer: Buffer,
  Date: Date,
  msg: { payload: sampleData },
  node: mockNode,
  global: {},
  flow: {},
  require: require,
  process: process,
  __dirname: __dirname,
  __filename: processorFile
};

// We need to create a proper module environment for the processor
// const vm = require('vm');  // Already required above
// const Module = require('module');  // Already required above

// Create a mock module to run the processor
const mockModule = new Module(processorFile);
mockModule.filename = processorFile;
mockModule.paths = Module._nodeModulePaths(path.dirname(processorFile));

// Prepare the module wrapper
const wrapper = Module.wrap(processorCode);
const script = new vm.Script(wrapper, {
  filename: processorFile,
  lineOffset: 0,
  displayErrors: true
});

// Set up the module exports and require function
sandbox.module = mockModule;
sandbox.exports = mockModule.exports;
sandbox.require = mockModule.require.bind(mockModule);

// Execute the processor in the sandbox
try {
  console.log('\nExecuting processor...');
  const compiledWrapper = script.runInNewContext(sandbox);
  compiledWrapper(sandbox.exports, sandbox.require, sandbox.module, processorFile, path.dirname(processorFile));
  
  // Now check the result
  const result = sandbox.msg;
  
  if (result.error) {
    console.error('\n❌ ERROR DETECTED:');
    console.error(`Error message: ${result.error.message}`);
    console.error('Error details:', result.error);
  } else if (result.topic) {
    console.log('\n✅ SUCCESS: SQL query generated');
    console.log('SQL Query:', result.topic);
  } else {
    console.log('\n❓ No SQL query generated (msg.topic is empty or undefined)');
    console.log('Result:', result);
  }
  
} catch (error) {
  console.error('\n❌ EXECUTION ERROR:');
  console.error(`Error message: ${error.message}`);
  console.error('Error stack:', error.stack);
  
  // Provide more detailed analysis
  console.log('\nDetailed Error Analysis:');
  
  if (error.message.includes('return') && error.message.includes('outside of function')) {
    console.error('The processor contains a return statement outside of a function.');
    console.error('SOLUTION: Wrap the entire processor code in a function.');
  } else if (error.message.includes('node is not defined')) {
    console.error('The processor is trying to use the "node" object but it\'s not properly defined.');
    console.error('SOLUTION: Make sure the node object is properly initialized in the test environment.');
  }
  
  // Check for common structural issues
  if (processorCode.includes('try {') && processorCode.indexOf('try {') < 100) {
    console.error('\nStructural Issue Detected:');
    console.error('The processor has a try-catch block at the top level, which can cause issues.');
    console.error('SOLUTION: Modify the processor to wrap the try-catch inside a function:');
    console.error(`
// Wrap the entire processor in a function
function processPayload(msg) {
  try {
    // ... existing code ...
    return msg;
  } catch (error) {
    // ... error handling ...
    return [null, msg];
  }
}

// Call the function and return its result
return processPayload(msg);
`);
  }
}
