/**
 * Node-RED Processor Tester for Unified Processor
 * 
 * This script tests the unified processor with sample data from the all_data directory.
 * It reads the sample data, runs it through the processor, and displays the result.
 * 
 * Usage: node node_red_processor_tester.js <controller_name> [sample_file] [sample_index] [options]
 * 
 * Options:
 *   --verbose    Show detailed SQL output
 *   --all        Process all payloads in the file
 *   --count      Only show the count of payloads in the file
 * 
 * Example: 
 *   node node_red_processor_tester.js MOE61_Halle206_GH4
 *   node node_red_processor_tester.js MFV3_Halle204_Rest_CH MFV3_Halle204_Rest_CH.txt 5
 *   node node_red_processor_tester.js MOE61_Halle206_GH4 --all
 *   node node_red_processor_tester.js MOE61_Halle206_GH4 --count
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

// Parse command line options
const options = {
  verbose: process.argv.includes('--verbose'),
  processAll: process.argv.includes('--all'),
  countOnly: process.argv.includes('--count')
};

// Get command line arguments (filter out option flags)
const args = process.argv.filter(arg => !arg.startsWith('--'));
const controllerName = args[2];
const sampleFileName = args[3];
const sampleIndex = parseInt(args[4] || '0', 10);

if (!controllerName) {
  console.error('Usage: node node_red_processor_tester.js <controller_name> [sample_file] [sample_index] [options]');
  console.error('Example: node node_red_processor_tester.js MOE61_Halle206_GH4');
  console.error('Options:');
  console.error('  --verbose    Show detailed SQL output');
  console.error('  --all        Process all payloads in the file');
  console.error('  --count      Only show the count of payloads in the file');
  process.exit(1);
}

// Paths - Updated to use the unified processor
const ALL_DATA_DIR = path.join(__dirname, '..', 'all_data');
const ONE_PAYLOAD_DIR = path.join(__dirname, '..', 'one_payload');
const PROCESSOR_FILE = path.join(__dirname, 'unified_processor.js');

// Find the sample file
let sampleFile;
if (sampleFileName) {
  // Use the specified sample file
  sampleFile = path.join(ALL_DATA_DIR, sampleFileName);
  if (!fs.existsSync(sampleFile)) {
    sampleFile = path.join(ONE_PAYLOAD_DIR, sampleFileName);
    if (!fs.existsSync(sampleFile)) {
      console.error(`Sample file not found: ${sampleFileName}`);
      process.exit(1);
    }
  }
} else {
  // Look for a matching sample file
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
}

// Check if the processor file exists
if (!fs.existsSync(PROCESSOR_FILE)) {
  console.error(`Unified processor file not found: ${PROCESSOR_FILE}`);
  process.exit(1);
}

console.log(`Using unified processor: ${PROCESSOR_FILE}`);
console.log(`Using sample file: ${sampleFile}`);

// Read the sample data
let sampleData;
let allSamples = [];
let totalPayloads = 0;

try {
  const content = fs.readFileSync(sampleFile, 'utf8');
  
  if (sampleFile.endsWith('.json')) {
    // JSON file - single object
    sampleData = JSON.parse(content);
    allSamples = [sampleData];
    totalPayloads = 1;
    console.log(`File contains 1 JSON payload`);
    
    if (options.countOnly) {
      console.log('Payload count: 1');
      process.exit(0);
    }
  } else {
    // Text file - one JSON object per line
    const lines = content.split('\n').filter(line => line.trim());
    totalPayloads = lines.length;
    console.log(`File contains ${lines.length} JSON payloads`);
    
    if (options.countOnly) {
      console.log('Payload count:', lines.length);
      process.exit(0);
    }
    
    if (options.processAll) {
      // Process all payloads
      allSamples = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.error(`Error parsing JSON: ${e.message}`);
          return null;
        }
      }).filter(sample => sample !== null);
      
      if (allSamples.length === 0) {
        console.error('No valid JSON payloads found in file');
        process.exit(1);
      }
      
      console.log(`Processing all ${allSamples.length} valid payloads`);
    } else {
      // Process only the specified payload
      try {
        sampleData = JSON.parse(lines[sampleIndex]);
        allSamples = [sampleData];
        console.log(`Processing sample ${sampleIndex} of ${lines.length}`);
      } catch (e) {
        console.error(`Error parsing JSON at line ${sampleIndex}: ${e.message}`);
        process.exit(1);
      }
    }
  }
} catch (error) {
  console.error(`Error reading sample file: ${error.message}`);
  process.exit(1);
}

// Read the processor code
const processorCode = fs.readFileSync(PROCESSOR_FILE, 'utf8');

// Process each sample
let successCount = 0;
let errorCount = 0;
let warningCount = 0;

for (let i = 0; i < allSamples.length; i++) {
  const currentSample = allSamples[i];
  
  if (options.processAll) {
    console.log(`\n======= Processing payload ${i + 1}/${allSamples.length} =======`);
  }
  
  // Create a mock node object for Node-RED environment
  const nodeErrors = [];
  const nodeWarnings = [];
  const mockNode = {
    error(msg) {
      nodeErrors.push(msg);
    },
    warn(msg) {
      nodeWarnings.push(msg);
    }
  };
  
  // Create a sandbox environment to run the processor
  const sandbox = {
    console: console,
    Buffer: Buffer,
    Date: Date,
    msg: { payload: currentSample },
    node: mockNode,
    global: {},
    flow: {},
    require: require,
    process: process,
    __dirname: __dirname,
    __filename: PROCESSOR_FILE
  };
  
  // Create a mock module to run the processor
  const mockModule = new Module(PROCESSOR_FILE);
  mockModule.filename = PROCESSOR_FILE;
  mockModule.paths = Module._nodeModulePaths(__dirname);
  
  // Prepare the module wrapper
  const wrapper = Module.wrap(processorCode);
  const script = new vm.Script(wrapper, {
    filename: PROCESSOR_FILE,
    lineOffset: 0,
    displayErrors: true
  });
  
  // Set up the module exports and require function
  sandbox.module = mockModule;
  sandbox.exports = mockModule.exports;
  sandbox.require = mockModule.require.bind(mockModule);
  
  // Execute the processor in the sandbox
  try {
    const compiledWrapper = script.runInNewContext(sandbox);
    compiledWrapper(sandbox.exports, sandbox.require, sandbox.module, PROCESSOR_FILE, path.dirname(PROCESSOR_FILE));
    
    // Now execute the processor with our sample data
    const result = sandbox.msg;
    
    // Check for errors
    if (nodeErrors.length > 0 || result.error) {
      errorCount++;
      
      if (!options.processAll) {
        console.log('\n❌ ERROR: Processing failed');
        
        if (nodeErrors.length > 0) {
          console.error('\nNode errors:');
          nodeErrors.forEach(err => console.error(`- ${err}`));
        }
        
        if (result.error) {
          console.error('\nError details:');
          console.error(JSON.stringify(result.error, null, 2));
        }
      } else {
        // In batch mode, just show a summary
        console.log(`❌ ERROR: ${result.error ? result.error.message : nodeErrors[0]}`);
      }
    } 
    // Check if SQL was generated successfully
    else if (result.topic) {
      successCount++;
      
      if (!options.processAll) {
        console.log('\n✅ SUCCESS: SQL query generated');
        
        // Show warnings if any
        if (nodeWarnings.length > 0) {
          warningCount += nodeWarnings.length;
          console.log('\nWarnings:');
          nodeWarnings.forEach(warn => console.warn(`- ${warn}`));
        }
        
        // Show processing metadata if available
        if (result.processed) {
          console.log('\nProcessing Details:');
          console.log(JSON.stringify(result.processed, null, 2));
        }
        
        // Option to show full SQL (hidden by default)
        console.log('\nTo view the full SQL query, add --verbose to the command');
        if (options.verbose) {
          console.log('\nSQL Query:');
          console.log(result.topic);
          
          // Analyze the SQL
          console.log('\n=== SQL ANALYSIS ===');
          
          // Check if it's an INSERT statement
          if (!result.topic.toUpperCase().includes('INSERT INTO')) {
            console.error('Not an INSERT statement');
          } else {
            // Extract table name
            const tableMatch = result.topic.match(/INSERT\s+INTO\s+([^\s(]+)/i);
            if (tableMatch) {
              console.log(`Target table: ${tableMatch[1]}`);
            }
            
            // Extract columns
            const columnsMatch = result.topic.match(/\(([^)]+)\)\s+VALUES/i);
            if (columnsMatch) {
              const columns = columnsMatch[1].split(',').map(col => col.trim());
              console.log(`Columns (${columns.length}): ${columns.join(', ')}`);
            }
            
            // Extract values
            const valuesMatch = result.topic.match(/VALUES\s*\(([^)]+)\)/i);
            if (valuesMatch) {
              const values = valuesMatch[1].split(',').map(val => val.trim());
              console.log(`Values (${values.length}): ${values.join(', ')}`);
              
              // Check for NULL values in important fields
              const requiredFields = ['Datum', 'ID_Code', 'Ergebnis'];
              const columnsArray = columnsMatch[1].split(',').map(col => col.trim());
              
              for (const field of requiredFields) {
                const index = columnsArray.indexOf(field);
                if (index !== -1 && values[index] === 'NULL') {
                  console.warn(`Warning: Required field ${field} has NULL value`);
                }
              }
            }
          }
        }
      } else {
        // In batch mode, just show a checkmark
        console.log('✅ SUCCESS');
      }
    } else {
      if (!options.processAll) {
        console.log('\n❓ No SQL query generated (msg.topic is empty or undefined)');
        
        // Show warnings if any
        if (nodeWarnings.length > 0) {
          warningCount += nodeWarnings.length;
          console.log('\nWarnings:');
          nodeWarnings.forEach(warn => console.warn(`- ${warn}`));
        }
        
        console.log('\nFull message:');
        console.log(JSON.stringify(result, null, 2));
      } else {
        // In batch mode, just show a summary
        console.log('❓ No SQL generated');
      }
    }
    
  } catch (error) {
    errorCount++;
    
    if (!options.processAll) {
      console.error(`\n❌ Error executing processor: ${error.message}`);
      console.error(error.stack);
    } else {
      // In batch mode, just show a summary
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Show summary if processing all samples
if (options.processAll && allSamples.length > 1) {
  console.log('\n======= SUMMARY =======');
  console.log(`Total payloads processed: ${allSamples.length} of ${totalPayloads}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  if (warningCount > 0) {
    console.log(`⚠️ Warnings: ${warningCount}`);
  }
  console.log('========================');
}
