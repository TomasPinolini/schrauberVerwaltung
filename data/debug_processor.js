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
const PROCESSOR_DIR = path.join(__dirname, 'data_handling', 'live');

// Find the processor file
const processorFile = path.join(PROCESSOR_DIR, `process_${controllerName}.js`);
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

// Process a single payload
function processPayload(processorName, payloadIndex) {
  try {
    // Load the processor
    const processorFile = path.join(PROCESSOR_DIR, `process_${processorName}.js`);
    if (!fs.existsSync(processorFile)) {
      console.error(`Processor file not found: ${processorFile}`);
      return;
    }
    
    // Load the payload data
    const payloadFile = path.join(ALL_DATA_DIR, `${processorName}.txt`);
    if (!fs.existsSync(payloadFile)) {
      console.error(`Payload file not found: ${payloadFile}`);
      return;
    }
    
    // Read and parse the payload file
    const fileContent = fs.readFileSync(payloadFile, 'utf8');
    const payloads = fileContent.split('\n\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error(`Error parsing payload: ${e.message}`);
          return null;
        }
      })
      .filter(payload => payload !== null);
    
    if (payloadIndex >= payloads.length) {
      console.error(`Payload index ${payloadIndex} out of range. File has ${payloads.length} payloads.`);
      return;
    }
    
    const payload = payloads[payloadIndex];
    
    // Create a mock Node-RED environment
    const node = {
      error: function(msg) { console.error(`ERROR: ${msg}`); },
      warn: function(msg) { console.warn(`WARNING: ${msg}`); },
      log: function(msg) { console.log(`LOG: ${msg}`); },
      debug: function(msg) { console.log(`DEBUG: ${msg}`); },
      status: function() {}
    };
    
    // Create a mock msg object
    const msg = {
      payload: payload,
      topic: '',
      _msgid: 'debug_' + Date.now()
    };
    
    // Load the processor code
    const processorCode = fs.readFileSync(processorFile, 'utf8');
    
    // Create a sandbox context
    const sandbox = {
      node,
      msg,
      console,
      Buffer,
      Date,
      require,
      process
    };
    
    // Execute the processor code in the sandbox
    const script = new vm.Script(processorCode);
    const context = vm.createContext(sandbox);
    const result = script.runInContext(context);
    
    // Display the result
    console.log('\nProcessor execution result:');
    if (result) {
      if (Array.isArray(result)) {
        console.log('Multiple outputs detected:');
        result.forEach((output, i) => {
          console.log(`\nOutput ${i + 1}:`);
          if (output) {
            if (output.topic) console.log(`SQL Query: ${output.topic}`);
            if (output.error) console.log(`Error: ${JSON.stringify(output.error, null, 2)}`);
            if (output.processed) console.log(`Processed: ${JSON.stringify(output.processed, null, 2)}`);
          } else {
            console.log('NULL output');
          }
        });
      } else {
        if (result.topic) console.log(`SQL Query: ${result.topic}`);
        if (result.error) console.log(`Error: ${JSON.stringify(result.error, null, 2)}`);
        if (result.processed) console.log(`Processed: ${JSON.stringify(result.processed, null, 2)}`);
      }
    } else {
      console.log('No result returned from processor');
    }
    
    // Check if the processor modified the original msg object
    console.log('\nFinal msg object:');
    console.log(`msg.topic: ${msg.topic ? msg.topic : 'NULL'}`);
    if (msg.error) console.log(`msg.error: ${JSON.stringify(msg.error, null, 2)}`);
    if (msg.processed) console.log(`msg.processed: ${JSON.stringify(msg.processed, null, 2)}`);
    
    // Check processor code structure
    console.log('\nProcessor code structure check:');
    checkProcessorCodeStructure(processorCode);
    
  } catch (error) {
    console.error(`Error processing payload: ${error.message}`);
    console.error(error.stack);
  }
}

// Call the processPayload function
processPayload(controllerName, sampleIndex);

// Function to check processor code structure
function checkProcessorCodeStructure(processorCode) {
  if (processorCode.includes('try {') && !processorCode.includes('function')) {
    console.error('⚠️ WARNING: The try block appears to be at the top level, not inside a function.');
    console.error('   This can cause issues when running in the batch processor.');
  }
}
