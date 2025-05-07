/**
 * Batch Processor for Schrauber Data - FIXED VERSION
 * 
 * This script processes all the payload files in the all_data directory
 * using the fixed unified processor and generates SQL statements
 * for insertion into the database.
 * 
 * Usage: node batch_processor_fixed.js [--dry-run] [--output=filename.sql] [--limit=N]
 * 
 * Options:
 *   --dry-run       Don't write SQL to file, just show stats
 *   --output=file   Specify output SQL file (default: fixed_output.sql)
 *   --limit=N       Process only N payloads per file (for testing)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

// Parse command line options
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  outputFile: 'fixed_output.sql',
  limit: Infinity
};

// Parse other options
args.forEach(arg => {
  if (arg.startsWith('--output=')) {
    options.outputFile = arg.substring('--output='.length);
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.substring('--limit='.length), 10);
  }
});

// Paths - Using the fixed unified processor
const ALL_DATA_DIR = path.join(__dirname, '..', 'all_data');
const PROCESSOR_FILE = path.join(__dirname, 'unified_processor.js');
const OUTPUT_FILE = path.join(__dirname, options.outputFile);

// Create a mock node object for Node-RED environment
const createMockNode = () => {
  const errors = [];
  const warnings = [];
  const logs = [];
  return {
    error: (msg) => { 
      errors.push(msg); 
      console.error(`[ERROR] ${msg}`);
    },
    warn: (msg) => { 
      warnings.push(msg); 
      console.warn(`[WARN] ${msg}`);
    },
    log: (msg) => {
      logs.push(msg);
      console.log(`[LOG] ${msg}`);
    },
    errors,
    warnings,
    logs
  };
};

// Load the fixed unified processor
function loadProcessor() {
  try {
    const processorCode = fs.readFileSync(PROCESSOR_FILE, 'utf8');
    return processorCode;
  } catch (error) {
    console.error(`Error loading processor ${PROCESSOR_FILE}: ${error.message}`);
    return null;
  }
}

// Process a single payload with the processor
function processPayload(payload, processorCode) {
  const mockNode = createMockNode();
  
  // Create a sandbox environment to run the processor
  const sandbox = {
    console: console,
    Buffer: Buffer,
    Date: Date,
    msg: { payload },
    node: mockNode,
    global: {},
    flow: {},
    require: require,
    process: process,
    __dirname: __dirname,
    __filename: 'processor.js'
  };
  
  // Create a mock module to run the processor
  const mockModule = new Module('processor.js');
  mockModule.filename = 'processor.js';
  mockModule.paths = Module._nodeModulePaths(__dirname);
  
  // Prepare the module wrapper
  const wrapper = Module.wrap(processorCode);
  const script = new vm.Script(wrapper, {
    filename: 'processor.js',
    lineOffset: 0,
    displayErrors: true
  });
  
  // Set up the module exports and require function
  sandbox.module = mockModule;
  sandbox.exports = mockModule.exports;
  sandbox.require = mockModule.require.bind(mockModule);
  
  try {
    // Execute the processor in the sandbox
    const compiledWrapper = script.runInNewContext(sandbox);
    compiledWrapper(sandbox.exports, sandbox.require, sandbox.module, 'processor.js', __dirname);
    
    return {
      result: sandbox.msg,
      errors: mockNode.errors,
      warnings: mockNode.warnings,
      logs: mockNode.logs
    };
  } catch (error) {
    return {
      result: null,
      errors: [`Execution error: ${error.message}`],
      warnings: mockNode.warnings,
      logs: mockNode.logs
    };
  }
}

// Process all payloads in a file
async function processFile(dataFile) {
  console.log(`\nProcessing ${path.basename(dataFile)} with fixed unified processor`);
  
  // Load the processor
  const processorCode = loadProcessor();
  if (!processorCode) {
    return { success: 0, error: 0, sql: [] };
  }
  
  // Read and parse the data file
  const content = fs.readFileSync(dataFile, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`Found ${lines.length} payloads in file`);
  
  // Limit the number of payloads to process if specified
  const payloadsToProcess = options.limit < lines.length ? options.limit : lines.length;
  console.log(`Processing ${payloadsToProcess} payloads...`);
  
  // Process each payload
  let successCount = 0;
  let errorCount = 0;
  const sqlStatements = [];
  
  for (let i = 0; i < payloadsToProcess; i++) {
    const line = lines[i];
    
    try {
      // Parse the JSON payload
      const payload = JSON.parse(line);
      
      // Process the payload
      const { result, errors, logs } = processPayload(payload, processorCode);
      
      // Check if processing was successful
      if (result && result.topic && !errors.length) {
        successCount++;
        sqlStatements.push(result.topic);
        
        // Show progress
        if (successCount % 100 === 0) {
          process.stdout.write('.');
          if (successCount % 1000 === 0) {
            process.stdout.write(` ${successCount}\n`);
          }
        }
      } else {
        errorCount++;
        console.error(`Error processing payload ${i + 1}: ${errors.join(', ')}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`Error parsing payload ${i + 1}: ${error.message}`);
    }
    
    // Show progress for errors too
    if ((successCount + errorCount) % 1000 === 0) {
      process.stdout.write(`\nProcessed ${successCount + errorCount} payloads (${successCount} successful, ${errorCount} errors)\n`);
    }
  }
  
  console.log(`\nCompleted processing ${path.basename(dataFile)}`);
  console.log(`Successful: ${successCount}, Errors: ${errorCount}`);
  
  return { success: successCount, error: errorCount, sql: sqlStatements };
}

// Main function
async function main() {
  console.log('Batch Processor for Schrauber Data (FIXED VERSION)');
  console.log('==================================================');
  console.log(`Mode: ${options.dryRun ? 'Dry Run' : 'Generate SQL'}`);
  console.log(`Output file: ${options.dryRun ? 'None' : options.outputFile}`);
  console.log(`Limit per file: ${options.limit === Infinity ? 'No limit' : options.limit}`);
  console.log(`Using processor: ${PROCESSOR_FILE}`);
  console.log('==================================================\n');
  
  // Get all data files
  const dataFiles = fs.readdirSync(ALL_DATA_DIR)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(ALL_DATA_DIR, file));
  
  console.log(`Found ${dataFiles.length} data files to process`);
  
  // Process each data file with the unified processor
  let totalSuccess = 0;
  let totalError = 0;
  let allSqlStatements = [];
  
  for (const dataFile of dataFiles) {
    const { success, error, sql } = await processFile(dataFile);
    totalSuccess += success;
    totalError += error;
    allSqlStatements = allSqlStatements.concat(sql);
  }
  
  // Write SQL statements to file if not in dry run mode
  if (!options.dryRun && allSqlStatements.length > 0) {
    // Add DROP and CREATE TABLE statement at the beginning
    const createTableSQL = `
-- Drop existing table if needed (comment this out if you want to keep existing data)
-- DROP TABLE IF EXISTS dbo.Auftraege_Fixed;

-- Create table for fixed historical data
CREATE TABLE dbo.Auftraege_Fixed
(
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Tabelle VARCHAR(50) NULL,
    Datum DATETIME NULL,
    ID_Code VARCHAR(255) NOT NULL,
    Program_Nr VARCHAR(255) NULL,
    Program_Name VARCHAR(255) NULL,
    Materialnummer VARCHAR(255) NULL,
    Serialnummer VARCHAR(255) NULL,
    Schraubkanal VARCHAR(255) NULL,
    Ergebnis VARCHAR(255) NULL,
    N_Letzter_Schritt INT NULL,
    P_Letzter_Schritt VARCHAR(255) NULL,
    Drehmoment_Nom FLOAT NULL,
    Drehmoment_Ist FLOAT NULL,
    Drehmoment_Min FLOAT NULL,
    Drehmoment_Max FLOAT NULL,
    Winkel_Nom FLOAT NULL,
    Winkel_Ist FLOAT NULL,
    Winkel_Min FLOAT NULL,
    Winkel_Max FLOAT NULL,
    Winkelwerte VARCHAR(MAX) NULL,
    Drehmomentwerte VARCHAR(MAX) NULL,
    Archived_Date DATETIME DEFAULT GETDATE() NOT NULL
);
GO

-- Create indexes for better performance
CREATE INDEX IX_Auftraege_Fixed_Datum ON dbo.Auftraege_Fixed(Datum);
CREATE INDEX IX_Auftraege_Fixed_ID_Code ON dbo.Auftraege_Fixed(ID_Code);
CREATE INDEX IX_Auftraege_Fixed_Materialnummer ON dbo.Auftraege_Fixed(Materialnummer);
CREATE INDEX IX_Auftraege_Fixed_Serialnummer ON dbo.Auftraege_Fixed(Serialnummer);
GO

-- Insert statements follow
`;
    
    // Modify SQL statements to use the new table name
    const modifiedSqlStatements = allSqlStatements.map(sql => 
      sql.replace('INSERT INTO dbo.Auftraege', 'INSERT INTO dbo.Auftraege_Fixed')
    );
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, createTableSQL + modifiedSqlStatements.join('\n') + '\n');
    console.log(`\nWrote ${modifiedSqlStatements.length} SQL statements to ${options.outputFile}`);
  }
  
  // Show summary
  console.log('\n==================================');
  console.log('SUMMARY');
  console.log('==================================');
  console.log(`Total successful: ${totalSuccess}`);
  console.log(`Total errors: ${totalError}`);
  console.log(`Total SQL statements: ${allSqlStatements.length}`);
  console.log('==================================');
  
  if (!options.dryRun) {
    console.log('\nTo execute the SQL file:');
    console.log('1. Open SQL Server Management Studio');
    console.log('2. Connect to your database server');
    console.log(`3. Open the generated SQL file: ${options.outputFile}`);
    console.log('4. Execute the script (this may take some time)');
    console.log('\nTip: For large files, consider splitting the SQL file into smaller chunks');
    console.log('\nIMPORTANT: This script creates a NEW table called dbo.Auftraege_Fixed');
    console.log('with the corrected angle and torque values. Your original data remains untouched.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
