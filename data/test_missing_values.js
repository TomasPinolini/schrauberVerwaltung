/**
 * Test script to check for missing values in payload data
 * 
 * This script analyzes all payload files to see how many contain the values for:
 * - Drehmoment_Min
 * - Drehmoment_Max
 * - Winkel_Nom
 * - Winkel_Ist
 * - Winkel_Min
 * - Winkel_Max
 * 
 * It generates a report and saves it to the missing_values folder with a timestamp
 * to track progress over time.
 */

const fs = require('fs');
const path = require('path');

// Paths
const PAYLOAD_DIR = path.join(__dirname, 'all_data');
const MISSING_VALUES_DIR = path.join(__dirname, 'missing_values');
const CURRENT_REPORT_FILE = path.join(__dirname, 'missing_values_report.txt');

// Create timestamp for the report file
const now = new Date();
const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
const TIMESTAMPED_REPORT_FILE = path.join(MISSING_VALUES_DIR, `missing_values_${timestamp}.txt`);

// Ensure the missing_values directory exists
if (!fs.existsSync(MISSING_VALUES_DIR)) {
  fs.mkdirSync(MISSING_VALUES_DIR, { recursive: true });
}

// Function to extract values from tightening functions
function extractValuesFromFunctions(functions) {
  if (!Array.isArray(functions)) return {};
  
  const result = {
    Drehmoment_Nom: null,
    Drehmoment_Ist: null,
    Drehmoment_Min: null,
    Drehmoment_Max: null,
    Winkel_Nom: null,
    Winkel_Ist: null,
    Winkel_Min: null,
    Winkel_Max: null
  };
  
  // Look for specific function names
  for (const func of functions) {
    if (!func || !func.name) continue;
    
    // Torque values
    if (func.name === 'TF Torque') {
      result.Drehmoment_Nom = func.nom;
      result.Drehmoment_Ist = func.act;
    } 
    // Torque Min
    else if (func.name === 'MF TorqueMin') {
      result.Drehmoment_Min = func.nom;
    } 
    // Torque Max - check both variants
    else if (func.name === 'MF TorqueMax' || func.name === 'MFs TorqueMax') {
      result.Drehmoment_Max = func.nom;
    } 
    // Angle values
    else if (func.name === 'TF Angle' || func.name === 'TF Yield Point') {
      result.Winkel_Nom = func.nom;
      result.Winkel_Ist = func.act;
    } 
    // Angle Min - check both variants
    else if (func.name === 'MF AngleMin' || func.name === 'MFs AngleMin') {
      result.Winkel_Min = func.nom;
    } 
    // Angle Max - check both variants
    else if (func.name === 'MF AngleMax' || func.name === 'MFs AngleMax') {
      result.Winkel_Max = func.nom;
    }
  }
  
  return result;
}

// Function to process a single payload
function processPayload(payload, controllerType) {
  // For GH4 controller which has channels
  if (controllerType.includes('GH4') && payload.channels && Array.isArray(payload.channels)) {
    const results = [];
    
    for (const channel of payload.channels) {
      const steps = Array.isArray(channel['tightening steps']) ? channel['tightening steps'] : [];
      if (steps.length === 0) continue;
      
      const lastStep = steps[steps.length - 1];
      const functions = Array.isArray(lastStep['tightening functions']) ? lastStep['tightening functions'] : [];
      
      results.push(extractValuesFromFunctions(functions));
    }
    
    return results;
  } 
  // For standard controllers
  else {
    const steps = Array.isArray(payload['tightening steps']) ? payload['tightening steps'] : [];
    if (steps.length === 0) return [];
    
    const lastStep = steps[steps.length - 1];
    const functions = Array.isArray(lastStep['tightening functions']) ? lastStep['tightening functions'] : [];
    
    return [extractValuesFromFunctions(functions)];
  }
}

// Main function
async function main() {
  console.log('Analyzing payload files for missing values...');
  
  // Get all payload files
  const files = fs.readdirSync(PAYLOAD_DIR)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(PAYLOAD_DIR, file));
  
  console.log(`Found ${files.length} payload files to analyze`);
  
  // Statistics
  const stats = {
    timestamp: now.toISOString(),
    totalPayloads: 0,
    Drehmoment_Nom: 0,
    Drehmoment_Ist: 0,
    Drehmoment_Min: 0,
    Drehmoment_Max: 0,
    Winkel_Nom: 0,
    Winkel_Ist: 0,
    Winkel_Min: 0,
    Winkel_Max: 0,
    controllerStats: {}
  };
  
  // Process each file
  for (const file of files) {
    const controllerType = path.basename(file, '.txt');
    if (!stats.controllerStats[controllerType]) {
      stats.controllerStats[controllerType] = {
        totalPayloads: 0,
        Drehmoment_Nom: 0,
        Drehmoment_Ist: 0,
        Drehmoment_Min: 0,
        Drehmoment_Max: 0,
        Winkel_Nom: 0,
        Winkel_Ist: 0,
        Winkel_Min: 0,
        Winkel_Max: 0
      };
    }
    
    try {
      // Read the file line by line
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Correct controller type for MOE6_Halle206_GH4 to MOE61_Halle206_GH4
      let actualControllerType = controllerType;
      if (controllerType === 'MOE6_Halle206_GH4') {
        actualControllerType = 'MOE61_Halle206_GH4';
        // Initialize stats for the corrected controller type if it doesn't exist
        if (!stats.controllerStats[actualControllerType]) {
          stats.controllerStats[actualControllerType] = {
            totalPayloads: 0,
            Drehmoment_Nom: 0,
            Drehmoment_Ist: 0,
            Drehmoment_Min: 0,
            Drehmoment_Max: 0,
            Winkel_Nom: 0,
            Winkel_Ist: 0,
            Winkel_Min: 0,
            Winkel_Max: 0
          };
        }
      }
      
      // Process only the first 5 payloads (or fewer if file has less than 5)
      console.log(`Processing up to 5 payloads from ${actualControllerType}`);
      
      let processedResults = [];
      let totalPayloadsProcessed = 0;
      
      for (let i = 0; i < lines.length && totalPayloadsProcessed < 5; i++) {
        try {
          const payload = JSON.parse(lines[i]);
          const results = processPayload(payload, actualControllerType);
          
          // For GH4 controllers, we might get multiple results per line
          // Only add as many as needed to reach 5 total payloads
          const resultsToAdd = Math.min(results.length, 5 - totalPayloadsProcessed);
          processedResults = processedResults.concat(results.slice(0, resultsToAdd));
          totalPayloadsProcessed += resultsToAdd;
        } catch (parseError) {
          console.error(`Error parsing payload ${i+1} in ${file}: ${parseError.message}`);
        }
      }
      
      // Update statistics
      stats.totalPayloads += processedResults.length;
      stats.controllerStats[actualControllerType].totalPayloads += processedResults.length;
      
      for (const result of processedResults) {
        if (result.Drehmoment_Nom !== null) {
          stats.Drehmoment_Nom++;
          stats.controllerStats[actualControllerType].Drehmoment_Nom++;
        }
        if (result.Drehmoment_Ist !== null) {
          stats.Drehmoment_Ist++;
          stats.controllerStats[actualControllerType].Drehmoment_Ist++;
        }
        if (result.Drehmoment_Min !== null) {
          stats.Drehmoment_Min++;
          stats.controllerStats[actualControllerType].Drehmoment_Min++;
        }
        if (result.Drehmoment_Max !== null) {
          stats.Drehmoment_Max++;
          stats.controllerStats[actualControllerType].Drehmoment_Max++;
        }
        if (result.Winkel_Nom !== null) {
          stats.Winkel_Nom++;
          stats.controllerStats[actualControllerType].Winkel_Nom++;
        }
        if (result.Winkel_Ist !== null) {
          stats.Winkel_Ist++;
          stats.controllerStats[actualControllerType].Winkel_Ist++;
        }
        if (result.Winkel_Min !== null) {
          stats.Winkel_Min++;
          stats.controllerStats[actualControllerType].Winkel_Min++;
        }
        if (result.Winkel_Max !== null) {
          stats.Winkel_Max++;
          stats.controllerStats[actualControllerType].Winkel_Max++;
        }
      }
      
      console.log(`Processed ${actualControllerType}: ${processedResults.length} payloads`);
    } catch (error) {
      console.error(`Error processing ${file}: ${error.message}`);
    }
  }
  
  // Generate report
  let report = 'Missing Values Analysis Report\n';
  report += '==============================\n\n';
  report += `Timestamp: ${stats.timestamp}\n\n`;
  report += `Total payloads analyzed: ${stats.totalPayloads}\n\n`;
  report += 'Overall Statistics:\n';
  report += `Drehmoment_Nom: ${stats.Drehmoment_Nom} (${(stats.Drehmoment_Nom / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Drehmoment_Ist: ${stats.Drehmoment_Ist} (${(stats.Drehmoment_Ist / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Drehmoment_Min: ${stats.Drehmoment_Min} (${(stats.Drehmoment_Min / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Drehmoment_Max: ${stats.Drehmoment_Max} (${(stats.Drehmoment_Max / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Winkel_Nom: ${stats.Winkel_Nom} (${(stats.Winkel_Nom / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Winkel_Ist: ${stats.Winkel_Ist} (${(stats.Winkel_Ist / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Winkel_Min: ${stats.Winkel_Min} (${(stats.Winkel_Min / stats.totalPayloads * 100).toFixed(2)}%)\n`;
  report += `Winkel_Max: ${stats.Winkel_Max} (${(stats.Winkel_Max / stats.totalPayloads * 100).toFixed(2)}%)\n\n`;
  
  report += 'Controller-Specific Statistics:\n';
  for (const [controller, controllerStats] of Object.entries(stats.controllerStats)) {
    if (controllerStats.totalPayloads === 0) continue;
    
    report += `\n${controller} (${controllerStats.totalPayloads} payloads):\n`;
    report += `  Drehmoment_Nom: ${controllerStats.Drehmoment_Nom} (${(controllerStats.Drehmoment_Nom / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Drehmoment_Ist: ${controllerStats.Drehmoment_Ist} (${(controllerStats.Drehmoment_Ist / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Drehmoment_Min: ${controllerStats.Drehmoment_Min} (${(controllerStats.Drehmoment_Min / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Drehmoment_Max: ${controllerStats.Drehmoment_Max} (${(controllerStats.Drehmoment_Max / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Winkel_Nom: ${controllerStats.Winkel_Nom} (${(controllerStats.Winkel_Nom / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Winkel_Ist: ${controllerStats.Winkel_Ist} (${(controllerStats.Winkel_Ist / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Winkel_Min: ${controllerStats.Winkel_Min} (${(controllerStats.Winkel_Min / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
    report += `  Winkel_Max: ${controllerStats.Winkel_Max} (${(controllerStats.Winkel_Max / controllerStats.totalPayloads * 100).toFixed(2)}%)\n`;
  }
  
  // Save JSON stats for programmatic analysis
  const jsonStats = JSON.stringify(stats, null, 2);
  fs.writeFileSync(path.join(MISSING_VALUES_DIR, `missing_values_${timestamp}.json`), jsonStats);
  
  // Write reports to both the current report file and the timestamped file
  fs.writeFileSync(CURRENT_REPORT_FILE, report);
  fs.writeFileSync(TIMESTAMPED_REPORT_FILE, report);
  
  console.log(`\nAnalysis complete. Reports written to:`);
  console.log(`- ${CURRENT_REPORT_FILE}`);
  console.log(`- ${TIMESTAMPED_REPORT_FILE}`);
  console.log(`- ${path.join(MISSING_VALUES_DIR, `missing_values_${timestamp}.json`)}`);
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
