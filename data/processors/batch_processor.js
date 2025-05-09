/**
 * Batch Processor for Schrauber Data
 * 
 * This script processes large text files containing multiple JSON payloads
 * and generates SQL files for database import.
 * 
 * It's specifically designed to handle the large files in the all_data folder.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import the unified processor
const unifiedProcessorPath = path.join(__dirname, 'simplified_unified_processor.js');
const unifiedProcessorCode = fs.readFileSync(unifiedProcessorPath, 'utf8');

// Create a mock Node-RED node object
const node = {
  log: (...args) => console.log('[NODE LOG]', ...args),
  warn: (...args) => console.warn('[NODE WARN]', ...args),
  error: (...args) => console.error('[NODE ERROR]', ...args)
};

// Paths
const dataDir = path.join(__dirname, '..', 'all_data');
const outputDir = path.join(__dirname, '..', 'batch_results');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Process the payload using the unified processor
function processPayload(payload, controllerType) {
  // Add the controllerType (filename without extension) as the Table property
  // This ensures the simplified_unified_processor uses it for the Tabelle column
  payload.Table = controllerType;
  
  // Create a context object with the payload and node
  const context = {
    payload: payload,
    node: node
  };

  // Execute the processor code with the context
  try {
    const processorFunction = new Function('msg', unifiedProcessorCode);
    return processorFunction(context);
  } catch (error) {
    console.error(`Error executing processor: ${error.message}`);
    return null;
  }
}

// Process all files
async function processAllFiles() {
  console.log(`Looking for data files in: ${dataDir}`);
  
  // Get all text files in the data directory
  const dataFiles = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(dataDir, file));
  
  console.log(`Found ${dataFiles.length} data files to process`);
  
  for (const filePath of dataFiles) {
    const fileName = path.basename(filePath);
    const controllerType = fileName.split('.')[0];
    
    console.log(`\nProcessing ${fileName}...`);
    await processFile(filePath, controllerType);
  }
  
  console.log('\nBatch processing complete!');
}

// Process a single file
async function processFile(filePath, controllerType) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  // Create output SQL file
  const outputPath = path.join(outputDir, `${controllerType}_processed.sql`);
  fs.writeFileSync(outputPath, `-- SQL generated for ${controllerType}\n-- Generated on ${new Date().toISOString()}\n-- Source file: ${path.basename(filePath)}\n\n`);
  
  let payloadCount = 0;
  let successCount = 0;
  
  for await (const line of rl) {
    // Check if the line is a complete JSON object
    if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
      payloadCount++;
      
      // Process the JSON payload
      try {
        const payload = JSON.parse(line);
        const result = processPayload(payload, controllerType);
        
        if (result && result.topic) {
          fs.appendFileSync(outputPath, `${result.topic}\n\n`);
          successCount++;
        }
      } catch (error) {
        fs.appendFileSync(outputPath, `-- ERROR processing payload ${payloadCount}: ${error.message}\n\n`);
      }
      
      // Log progress periodically
      if (payloadCount % 100 === 0) {
        process.stdout.write(`Processed ${payloadCount} payloads...\r`);
      }
    }
  }
  
  // Add summary to SQL file
  fs.appendFileSync(outputPath, `-- Summary: Successfully processed ${successCount}/${payloadCount} payloads (${(successCount / payloadCount * 100).toFixed(2)}%)\n`);
  
  console.log(`Processed ${payloadCount} payloads from ${path.basename(filePath)}`);
  console.log(`Success rate: ${(successCount / payloadCount * 100).toFixed(2)}%`);
  console.log(`Output written to: ${outputPath}`);
}

// Run the processor
processAllFiles().catch(error => {
  console.error(`Error in batch processor: ${error.message}`);
  process.exit(1);
});
