/**
 * Deep Analysis Processor for Schrauber Data
 * 
 * This script analyzes all data files in the all_data folder,
 * extracting key metrics and generating comprehensive reports.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import the processors
const simplifiedProcessorPath = path.join(__dirname, 'simplified_unified_processor.js');
const simplifiedProcessorCode = fs.readFileSync(simplifiedProcessorPath, 'utf8');

// Create a mock Node-RED node object
const node = {
  log: (...args) => console.log('[NODE LOG]', ...args),
  warn: (...args) => console.warn('[NODE WARN]', ...args),
  error: (...args) => console.error('[NODE ERROR]', ...args)
};

// Paths
const dataDir = path.join(__dirname, '..', 'all_data');
const outputDir = path.join(__dirname, '..', 'analysis_results');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Statistics to collect
const stats = {
  totalPayloads: 0,
  successfulPayloads: 0,
  failedPayloads: 0,
  controllerTypes: {},
  fieldStats: {},
  torqueStats: {
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
    sum: 0,
    count: 0,
    values: []
  },
  angleStats: {
    min: Number.MAX_VALUE,
    max: Number.MIN_VALUE,
    sum: 0,
    count: 0,
    values: []
  },
  resultStats: {},
  timeDistribution: {}, // Date-based distribution
  errors: []
};

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
    
    // Initialize controller type stats if not exists
    if (!stats.controllerTypes[controllerType]) {
      stats.controllerTypes[controllerType] = {
        totalPayloads: 0,
        successfulPayloads: 0,
        failedPayloads: 0,
        torqueStats: {
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
          sum: 0,
          count: 0,
          values: []
        },
        angleStats: {
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE,
          sum: 0,
          count: 0,
          values: []
        },
        resultStats: {}
      };
    }
    
    await processFile(filePath, controllerType);
  }
  
  // Generate reports
  generateReports();
  
  console.log('\nAnalysis complete!');
}

// Process a single file
async function processFile(filePath, controllerType) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
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
        
        if (result) {
          successCount++;
          stats.successfulPayloads++;
          stats.controllerTypes[controllerType].successfulPayloads++;
          
          // Update statistics based on the processed payload
          updateStats(result, controllerType);
        } else {
          stats.failedPayloads++;
          stats.controllerTypes[controllerType].failedPayloads++;
        }
      } catch (error) {
        stats.failedPayloads++;
        stats.controllerTypes[controllerType].failedPayloads++;
        
        stats.errors.push({
          controllerType,
          error: error.message,
          payload: line.substring(0, 200) + "..."
        });
      }
      
      // Log progress periodically
      if (payloadCount % 100 === 0) {
        process.stdout.write(`Processed ${payloadCount} payloads...\r`);
      }
    }
  }
  
  stats.totalPayloads += payloadCount;
  stats.controllerTypes[controllerType].totalPayloads += payloadCount;
  
  console.log(`Processed ${payloadCount} payloads from ${path.basename(filePath)}`);
  console.log(`Success rate: ${(successCount / payloadCount * 100).toFixed(2)}%`);
}

// Process a single payload
function processPayload(payload, controllerType) {
  try {
    // Create a message object like Node-RED would
    const msg = { payload };
    
    // Create a function context to run the processor
    const context = {
      node,
      msg,
      console,
      Buffer,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean
    };
    
    // Execute the processor code
    const processorFn = new Function(...Object.keys(context), simplifiedProcessorCode);
    const result = processorFn(...Object.values(context));
    
    if (result && result.topic) {
      // Extract the processed data
      return {
        controllerType,
        sql: result.topic,
        processed: result.processed,
        timestamp: new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error processing payload: ${error.message}`);
    return null;
  }
}

// Update statistics based on processed payload
function updateStats(result, controllerType) {
  // Extract values from SQL
  const fields = extractFieldsFromSql(result.sql);
  
  // Update field statistics
  Object.keys(fields).forEach(field => {
    if (!stats.fieldStats[field]) {
      stats.fieldStats[field] = { present: 0, missing: 0 };
    }
    
    if (fields[field] !== 'NULL') {
      stats.fieldStats[field].present++;
    } else {
      stats.fieldStats[field].missing++;
    }
  });
  
  // Update torque statistics if present
  if (fields.Drehmoment_Ist && fields.Drehmoment_Ist !== 'NULL') {
    const torque = parseFloat(fields.Drehmoment_Ist);
    if (!isNaN(torque)) {
      // Global stats
      stats.torqueStats.min = Math.min(stats.torqueStats.min, torque);
      stats.torqueStats.max = Math.max(stats.torqueStats.max, torque);
      stats.torqueStats.sum += torque;
      stats.torqueStats.count++;
      stats.torqueStats.values.push(torque);
      
      // Controller-specific stats
      stats.controllerTypes[controllerType].torqueStats.min = 
        Math.min(stats.controllerTypes[controllerType].torqueStats.min, torque);
      stats.controllerTypes[controllerType].torqueStats.max = 
        Math.max(stats.controllerTypes[controllerType].torqueStats.max, torque);
      stats.controllerTypes[controllerType].torqueStats.sum += torque;
      stats.controllerTypes[controllerType].torqueStats.count++;
      stats.controllerTypes[controllerType].torqueStats.values.push(torque);
    }
  }
  
  // Update angle statistics if present
  if (fields.Winkel_Ist && fields.Winkel_Ist !== 'NULL') {
    const angle = parseFloat(fields.Winkel_Ist);
    if (!isNaN(angle)) {
      // Global stats
      stats.angleStats.min = Math.min(stats.angleStats.min, angle);
      stats.angleStats.max = Math.max(stats.angleStats.max, angle);
      stats.angleStats.sum += angle;
      stats.angleStats.count++;
      stats.angleStats.values.push(angle);
      
      // Controller-specific stats
      stats.controllerTypes[controllerType].angleStats.min = 
        Math.min(stats.controllerTypes[controllerType].angleStats.min, angle);
      stats.controllerTypes[controllerType].angleStats.max = 
        Math.max(stats.controllerTypes[controllerType].angleStats.max, angle);
      stats.controllerTypes[controllerType].angleStats.sum += angle;
      stats.controllerTypes[controllerType].angleStats.count++;
      stats.controllerTypes[controllerType].angleStats.values.push(angle);
    }
  }
  
  // Update result statistics
  if (fields.Ergebnis && fields.Ergebnis !== 'NULL') {
    const result = fields.Ergebnis.replace(/'/g, '').trim();
    
    // Global stats
    if (!stats.resultStats[result]) {
      stats.resultStats[result] = 1;
    } else {
      stats.resultStats[result]++;
    }
    
    // Controller-specific stats
    if (!stats.controllerTypes[controllerType].resultStats[result]) {
      stats.controllerTypes[controllerType].resultStats[result] = 1;
    } else {
      stats.controllerTypes[controllerType].resultStats[result]++;
    }
  }
  
  // Update time distribution
  if (fields.Datum && fields.Datum !== 'NULL') {
    const dateStr = fields.Datum.replace(/'/g, '').trim().split(' ')[0]; // Get just the date part
    
    if (!stats.timeDistribution[dateStr]) {
      stats.timeDistribution[dateStr] = 1;
    } else {
      stats.timeDistribution[dateStr]++;
    }
  }
}

// Extract fields from SQL INSERT statement
function extractFieldsFromSql(sql) {
  const fields = {};
  
  // Extract column names
  const columnsMatch = sql.match(/INSERT INTO .*?\(([\s\S]*?)\)/i);
  if (!columnsMatch) return fields;
  
  const columns = columnsMatch[1].split(',').map(col => col.trim());
  
  // Extract values from the first tuple
  const valuesMatch = sql.match(/VALUES\s*\(([\s\S]*?)\)/i);
  if (!valuesMatch) return fields;
  
  const values = valuesMatch[1].split(',').map(val => val.trim());
  
  // Map columns to values
  for (let i = 0; i < Math.min(columns.length, values.length); i++) {
    fields[columns[i]] = values[i];
  }
  
  return fields;
}

// Generate statistical reports
function generateReports() {
  // Calculate derived statistics
  const torqueAvg = stats.torqueStats.count > 0 ? stats.torqueStats.sum / stats.torqueStats.count : 0;
  const angleAvg = stats.angleStats.count > 0 ? stats.angleStats.sum / stats.angleStats.count : 0;
  
  // Calculate standard deviations
  let torqueStdDev = 0;
  if (stats.torqueStats.count > 0) {
    const sumSquaredDiff = stats.torqueStats.values.reduce((sum, value) => {
      return sum + Math.pow(value - torqueAvg, 2);
    }, 0);
    torqueStdDev = Math.sqrt(sumSquaredDiff / stats.torqueStats.count);
  }
  
  let angleStdDev = 0;
  if (stats.angleStats.count > 0) {
    const sumSquaredDiff = stats.angleStats.values.reduce((sum, value) => {
      return sum + Math.pow(value - angleAvg, 2);
    }, 0);
    angleStdDev = Math.sqrt(sumSquaredDiff / stats.angleStats.count);
  }
  
  // Main summary report
  let summaryReport = `# Schrauber Data Analysis Summary\n\n`;
  summaryReport += `Generated on: ${new Date().toISOString()}\n\n`;
  summaryReport += `## Overall Statistics\n\n`;
  summaryReport += `- Total payloads processed: ${stats.totalPayloads}\n`;
  summaryReport += `- Successfully processed: ${stats.successfulPayloads} (${(stats.successfulPayloads / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  summaryReport += `- Failed to process: ${stats.failedPayloads} (${(stats.failedPayloads / stats.totalPayloads * 100).toFixed(2)}%)\n\n`;
  
  // Controller type breakdown
  summaryReport += `## Controller Type Breakdown\n\n`;
  summaryReport += `| Controller Type | Payloads | Success Rate | Avg Torque | Avg Angle |\n`;
  summaryReport += `|----------------|----------|--------------|------------|----------|\n`;
  
  Object.keys(stats.controllerTypes).forEach(type => {
    const ctStats = stats.controllerTypes[type];
    const successRate = (ctStats.successfulPayloads / ctStats.totalPayloads * 100).toFixed(2);
    const avgTorque = ctStats.torqueStats.count > 0 ? 
      (ctStats.torqueStats.sum / ctStats.torqueStats.count).toFixed(2) : 'N/A';
    const avgAngle = ctStats.angleStats.count > 0 ? 
      (ctStats.angleStats.sum / ctStats.angleStats.count).toFixed(2) : 'N/A';
    
    summaryReport += `| ${type} | ${ctStats.totalPayloads} | ${successRate}% | ${avgTorque} | ${avgAngle} |\n`;
  });
  
  summaryReport += `\n`;
  
  // Torque statistics
  summaryReport += `## Torque Statistics\n\n`;
  summaryReport += `- Minimum: ${stats.torqueStats.min !== Number.MAX_VALUE ? stats.torqueStats.min.toFixed(2) : 'N/A'}\n`;
  summaryReport += `- Maximum: ${stats.torqueStats.max !== Number.MIN_VALUE ? stats.torqueStats.max.toFixed(2) : 'N/A'}\n`;
  summaryReport += `- Average: ${torqueAvg.toFixed(2)}\n`;
  summaryReport += `- Standard Deviation: ${torqueStdDev.toFixed(2)}\n`;
  summaryReport += `- Sample Size: ${stats.torqueStats.count}\n\n`;
  
  // Angle statistics
  summaryReport += `## Angle Statistics\n\n`;
  summaryReport += `- Minimum: ${stats.angleStats.min !== Number.MAX_VALUE ? stats.angleStats.min.toFixed(2) : 'N/A'}\n`;
  summaryReport += `- Maximum: ${stats.angleStats.max !== Number.MIN_VALUE ? stats.angleStats.max.toFixed(2) : 'N/A'}\n`;
  summaryReport += `- Average: ${angleAvg.toFixed(2)}\n`;
  summaryReport += `- Standard Deviation: ${angleStdDev.toFixed(2)}\n`;
  summaryReport += `- Sample Size: ${stats.angleStats.count}\n\n`;
  
  // Result statistics
  summaryReport += `## Result Statistics\n\n`;
  summaryReport += `| Result | Count | Percentage |\n`;
  summaryReport += `|--------|-------|------------|\n`;
  
  Object.keys(stats.resultStats).forEach(result => {
    const count = stats.resultStats[result];
    const percentage = (count / stats.successfulPayloads * 100).toFixed(2);
    summaryReport += `| ${result} | ${count} | ${percentage}% |\n`;
  });
  
  summaryReport += `\n`;
  
  // Field extraction statistics
  summaryReport += `## Field Extraction Statistics\n\n`;
  summaryReport += `| Field | Present | Missing | Extraction Rate |\n`;
  summaryReport += `|-------|---------|---------|----------------|\n`;
  
  Object.keys(stats.fieldStats).sort().forEach(field => {
    const present = stats.fieldStats[field].present;
    const missing = stats.fieldStats[field].missing;
    const total = present + missing;
    const extractionRate = (present / total * 100).toFixed(2);
    
    summaryReport += `| ${field} | ${present} | ${missing} | ${extractionRate}% |\n`;
  });
  
  // Write summary report
  fs.writeFileSync(path.join(outputDir, 'summary_report.md'), summaryReport);
  console.log(`Summary report written to: ${path.join(outputDir, 'summary_report.md')}`);
  
  // Generate detailed controller-specific reports
  Object.keys(stats.controllerTypes).forEach(type => {
    generateControllerReport(type);
  });
  
  // Generate error report
  generateErrorReport();
}

// Generate controller-specific report
function generateControllerReport(controllerType) {
  const ctStats = stats.controllerTypes[controllerType];
  
  let report = `# ${controllerType} Controller Analysis\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Basic statistics
  report += `## Basic Statistics\n\n`;
  report += `- Total payloads: ${ctStats.totalPayloads}\n`;
  report += `- Successfully processed: ${ctStats.successfulPayloads} (${(ctStats.successfulPayloads / ctStats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `- Failed to process: ${ctStats.failedPayloads} (${(ctStats.failedPayloads / ctStats.totalPayloads * 100).toFixed(2)}%)\n\n`;
  
  // Torque statistics
  const torqueAvg = ctStats.torqueStats.count > 0 ? ctStats.torqueStats.sum / ctStats.torqueStats.count : 0;
  let torqueStdDev = 0;
  
  if (ctStats.torqueStats.count > 0) {
    const sumSquaredDiff = ctStats.torqueStats.values.reduce((sum, value) => {
      return sum + Math.pow(value - torqueAvg, 2);
    }, 0);
    torqueStdDev = Math.sqrt(sumSquaredDiff / ctStats.torqueStats.count);
  }
  
  report += `## Torque Statistics\n\n`;
  report += `- Minimum: ${ctStats.torqueStats.min !== Number.MAX_VALUE ? ctStats.torqueStats.min.toFixed(2) : 'N/A'}\n`;
  report += `- Maximum: ${ctStats.torqueStats.max !== Number.MIN_VALUE ? ctStats.torqueStats.max.toFixed(2) : 'N/A'}\n`;
  report += `- Average: ${torqueAvg.toFixed(2)}\n`;
  report += `- Standard Deviation: ${torqueStdDev.toFixed(2)}\n`;
  report += `- Sample Size: ${ctStats.torqueStats.count}\n\n`;
  
  // Angle statistics
  const angleAvg = ctStats.angleStats.count > 0 ? ctStats.angleStats.sum / ctStats.angleStats.count : 0;
  let angleStdDev = 0;
  
  if (ctStats.angleStats.count > 0) {
    const sumSquaredDiff = ctStats.angleStats.values.reduce((sum, value) => {
      return sum + Math.pow(value - angleAvg, 2);
    }, 0);
    angleStdDev = Math.sqrt(sumSquaredDiff / ctStats.angleStats.count);
  }
  
  report += `## Angle Statistics\n\n`;
  report += `- Minimum: ${ctStats.angleStats.min !== Number.MAX_VALUE ? ctStats.angleStats.min.toFixed(2) : 'N/A'}\n`;
  report += `- Maximum: ${ctStats.angleStats.max !== Number.MIN_VALUE ? ctStats.angleStats.max.toFixed(2) : 'N/A'}\n`;
  report += `- Average: ${angleAvg.toFixed(2)}\n`;
  report += `- Standard Deviation: ${angleStdDev.toFixed(2)}\n`;
  report += `- Sample Size: ${ctStats.angleStats.count}\n\n`;
  
  // Result statistics
  report += `## Result Statistics\n\n`;
  report += `| Result | Count | Percentage |\n`;
  report += `|--------|-------|------------|\n`;
  
  Object.keys(ctStats.resultStats).forEach(result => {
    const count = ctStats.resultStats[result];
    const percentage = (count / ctStats.successfulPayloads * 100).toFixed(2);
    report += `| ${result} | ${count} | ${percentage}% |\n`;
  });
  
  // Write controller report
  fs.writeFileSync(path.join(outputDir, `${controllerType}_report.md`), report);
  console.log(`Controller report written to: ${path.join(outputDir, `${controllerType}_report.md`)}`);
}

// Generate error report
function generateErrorReport() {
  let report = `# Error Analysis Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  report += `Total errors: ${stats.errors.length}\n\n`;
  
  // Group errors by controller type
  const errorsByController = {};
  stats.errors.forEach(error => {
    if (!errorsByController[error.controllerType]) {
      errorsByController[error.controllerType] = [];
    }
    errorsByController[error.controllerType].push(error);
  });
  
  // Generate report for each controller type
  Object.keys(errorsByController).forEach(controllerType => {
    const errors = errorsByController[controllerType];
    report += `## ${controllerType}\n\n`;
    report += `Total errors: ${errors.length}\n\n`;
    
    // Group by error message
    const errorGroups = {};
    errors.forEach(error => {
      if (!errorGroups[error.error]) {
        errorGroups[error.error] = [];
      }
      errorGroups[error.error].push(error);
    });
    
    // Report on each error type
    Object.keys(errorGroups).forEach(errorMsg => {
      const count = errorGroups[errorMsg].length;
      const percentage = (count / errors.length * 100).toFixed(2);
      
      report += `### ${errorMsg}\n\n`;
      report += `Count: ${count} (${percentage}% of errors for this controller)\n\n`;
      report += `Sample payload snippet:\n\`\`\`json\n${errorGroups[errorMsg][0].payload}\n\`\`\`\n\n`;
    });
  });
  
  // Write error report
  fs.writeFileSync(path.join(outputDir, 'error_report.md'), report);
  console.log(`Error report written to: ${path.join(outputDir, 'error_report.md')}`);
}

// Start processing
processAllFiles().catch(err => {
  console.error('Fatal error:', err);
});
