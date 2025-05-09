/**
 * Simplified Unified Processor for Schrauber Data
 * 
 * This processor handles all controller types with a clearer structure:
 * 1. First identifies the controller type
 * 2. Then uses a specific mapping strategy for that type
 * 3. Extracts values directly using consistent patterns
 * 
 * Supported controller types:
 * - Standard controllers (MFV3, MFV23, MOE61)
 * - GH4 controller (MOE6_Halle206_GH4/MOE61_Halle206_GH4)
 */

// Target database table
const TARGET_TABLE = "dbo.Auftraege_Fixed";

// ==================== Helper Functions ====================

/**
 * Format a value for SQL insertion
 * @param {*} v - The value to format
 * @param {boolean} str - Whether to format as a string (with quotes)
 * @returns {string} SQL-safe formatted value
 */
function fmt(v, str = false) {
  if (v === undefined || v === null || v === '') {
    return 'NULL';
  }
  return str ? `'${v.toString().replace(/'/g, "''")}'` : v;
}

/**
 * Convert a date to ISO format SQL datetime string
 * @param {*} v - Date value (string, Date object, or timestamp)
 * @returns {string|null} Formatted date string or null
 */
function formatDate(v) {
  if (!v) return null;
  try {
    return new Date(v).toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    node.warn(`Invalid date format: ${v}`);
    return null;
  }
}

/**
 * Extract material and serial number from ID code
 * @param {string} idCode - ID code string
 * @returns {Object} Object with material and serial properties
 */
function extractMaterialAndSerial(idCode) {
  if (!idCode) return { material: null, serial: null };
  
  // GH4 format: "R901450936-1108_001"
  if (idCode.includes('-') && idCode.includes('_')) {
    const materialPart = idCode.split('-')[0];
    const lastUnderscoreIndex = idCode.lastIndexOf('_');
    const serialPart = lastUnderscoreIndex !== -1 ? idCode.substring(lastUnderscoreIndex + 1) : null;
    
    return {
      material: materialPart || null,
      serial: serialPart || null
    };
  }
  
  // Standard format: "L 000000151112" - no material/serial extraction
  return { material: null, serial: null };
}

/**
 * Decode base64 encoded graph data
 * @param {Object} graph - Graph data object with base64 encoded values
 * @returns {Object} Object with decoded angle and torque values
 */
function decodeGraphB64(graph) {
  if (!graph) return { angleValues: [], torqueValues: [] };
  
  try {
    // Handle missing angle/torque values
    if (!graph['angle values'] || !graph['torque values']) {
      return { angleValues: [], torqueValues: [] };
    }
    
    const angleBuf = Buffer.from(graph['angle values'], 'base64');
    const torqueBuf = Buffer.from(graph['torque values'], 'base64');
    const angleValues = [];
    const torqueValues = [];
    
    // Default scale values if not provided
    const angleScale = graph['angle scale'] || 10000;
    const torqueScale = graph['torque scale'] || 100000;
    
    // Read 16-bit signed integers (Int16)
    for (let i = 0; i < angleBuf.length; i += 2) {
      angleValues.push(angleBuf.readInt16LE(i) / angleScale);
    }
    
    for (let i = 0; i < torqueBuf.length; i += 2) {
      torqueValues.push(torqueBuf.readInt16LE(i) / torqueScale);
    }
    
    return { angleValues, torqueValues };
  } catch (e) {
    node.error("Error decoding base64 graph data: " + e.message);
    return { angleValues: [], torqueValues: [] };
  }
}

/**
 * Extract values from tightening functions array
 * @param {Array} functions - Array of tightening function objects
 * @returns {Object} Object with extracted values
 */
function extractFromTighteningFunctions(functions) {
  if (!Array.isArray(functions)) {
    return {
      Drehmoment_Nom: null,
      Drehmoment_Ist: null,
      Drehmoment_Min: null,
      Drehmoment_Max: null,
      Winkel_Nom: null,
      Winkel_Ist: null,
      Winkel_Min: null,
      Winkel_Max: null
    };
  }
  
  const values = {
    Drehmoment_Nom: null,
    Drehmoment_Ist: null,
    Drehmoment_Min: null,
    Drehmoment_Max: null,
    Winkel_Nom: null,
    Winkel_Ist: null,
    Winkel_Min: null,
    Winkel_Max: null
  };
  
  // Process each function
  functions.forEach(fn => {
    if (!fn || !fn.name) return;
    
    const name = fn.name.trim();
    switch (name) {
      case 'TF Torque':
        values.Drehmoment_Nom = fn.nom;
        values.Drehmoment_Ist = fn.act;
        break;
      case 'MF TorqueMin':
        values.Drehmoment_Min = fn.nom;
        break;
      case 'MF TorqueMax':
      case 'MFs TorqueMax':
        values.Drehmoment_Max = fn.nom;
        break;
      case 'TF Angle':
      case 'TF Yield Point':
        values.Winkel_Nom = fn.nom;
        values.Winkel_Ist = fn.act;
        break;
      case 'MF AngleMin':
      case 'MFs AngleMin':
        values.Winkel_Min = fn.nom;
        break;
      case 'MF AngleMax':
      case 'MFs AngleMax':
        values.Winkel_Max = fn.nom;
        break;
    }
  });
  
  return values;
}

/**
 * Extract graph data from step
 * @param {Object} step - Step object with graph data
 * @returns {Object} Object with angle and torque values
 */
function extractGraphData(step) {
  if (!step) {
    return { Winkelwerte: null, Drehmomentwerte: null };
  }
  
  // Handle array format
  if (step.graph && Array.isArray(step.graph['angle values'])) {
    return {
      Winkelwerte: step.graph['angle values'].join(','),
      Drehmomentwerte: Array.isArray(step.graph['torque values']) ? step.graph['torque values'].join(',') : null
    };
  }
  
  // Handle base64 format
  if (step.graph_b64) {
    const { angleValues, torqueValues } = decodeGraphB64(step.graph_b64);
    return {
      Winkelwerte: angleValues.length > 0 ? angleValues.join(',') : null,
      Drehmomentwerte: torqueValues.length > 0 ? torqueValues.join(',') : null
    };
  }
  
  return { Winkelwerte: null, Drehmomentwerte: null };
}

/**
 * Process a standard controller (MFV3, MFV23, MOE61)
 * @param {Object} payload - Controller payload
 * @returns {Object} Processed data for SQL insertion
 */
function processStandardController(payload) {
  // Use payload.Table directly for the Tabelle column if available
  // Otherwise fall back to previous logic
  const tableTag = payload.Table;  
  
  const datum = formatDate(payload.dateIso || payload.date || new Date());
  const idCode = payload['id code'];
  
  // Extract material and serial number
  const { material, serial } = extractMaterialAndSerial(idCode);
  
  // Get tightening steps
  const steps = Array.isArray(payload['tightening steps']) ? payload['tightening steps'] : [];
  const lastStep = steps.length > 0 ? steps[steps.length - 1] : {};
  
  // Extract values from tightening functions
  const tighteningFunctions = Array.isArray(lastStep['tightening functions']) ? lastStep['tightening functions'] : [];
  const functionValues = extractFromTighteningFunctions(tighteningFunctions);
  
  // Extract graph data
  const graphData = extractGraphData(lastStep);
  
  // Build record
  return {
    Tabelle: tableTag,
    Datum: datum,
    ID_Code: idCode,
    Program_Nr: payload['prg nr'],
    Program_Name: payload['prg name'],
    Materialnummer: material,
    Serialnummer: serial,
    Schraubkanal: payload.nr || payload['node id'] || null,
    Ergebnis: (payload.result || payload['quality code'] || '').toString().trim().toUpperCase(),
    N_Letzter_Schritt: lastStep.row || null,
    P_Letzter_Schritt: lastStep.column || lastStep.name || null,
    ...functionValues,
    ...graphData
  };
}

/**
 * Process a GH4 controller with multiple channels
 * @param {Object} payload - Controller payload
 * @returns {Array} Array of processed data objects for SQL insertion
 */
function processGH4Controller(payload) {
  const results = [];
  // Use payload.Table directly for the Tabelle column if available
  // Otherwise fall back to previous logic
  const baseTableTag = payload.Table || payload.name || 
    (payload.channels && payload.channels.length > 0 && 
     payload.channels[0]['id code'] && 
     payload.channels[0]['id code'].startsWith('R')) ? 'MOE61_Halle206_GH4' : 'Unknown_GH4';
  
  // Process each channel
  if (Array.isArray(payload.channels)) {
    payload.channels.forEach((channel, idx) => {
      try {
        const datum = formatDate(channel.date || payload.date || new Date());
        const idCode = channel['id code'] || payload['id code'];
        
        if (!idCode) {
          node.warn(`Channel ${idx + 1}: Missing ID_Code, skipping`);
          return;
        }
        
        // Extract material and serial number
        const { material, serial } = extractMaterialAndSerial(idCode);
        
        // Get tightening steps
        const steps = Array.isArray(channel['tightening steps']) ? channel['tightening steps'] : [];
        const lastStep = steps.length > 0 ? steps[steps.length - 1] : {};
        
        // Extract values from tightening functions
        const tighteningFunctions = Array.isArray(lastStep['tightening functions']) ? lastStep['tightening functions'] : [];
        const functionValues = extractFromTighteningFunctions(tighteningFunctions);
        
        // Extract graph data
        const graphData = extractGraphData(lastStep);
        
        // Build record
        results.push({
          Tabelle: baseTableTag,
          Datum: datum,
          ID_Code: idCode,
          Program_Nr: channel['prg nr'],
          Program_Name: channel['prg name'],
          Materialnummer: material,
          Serialnummer: serial,
          Schraubkanal: channel.nr || idx + 1,
          Ergebnis: (channel.result || channel['quality code'] || '').toString().trim().toUpperCase(),
          N_Letzter_Schritt: lastStep.row || null,
          P_Letzter_Schritt: lastStep.column || lastStep.name || null,
          ...functionValues,
          ...graphData
        });
      } catch (channelError) {
        node.error(`Error processing channel ${idx + 1}: ${channelError.message}`);
      }
    });
  }
  
  return results;
}

/**
 * Generate SQL INSERT statement from processed records
 * @param {Array} records - Array of processed data objects
 * @returns {string} SQL INSERT statement
 */
function generateSqlInsert(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("No valid records to insert");
  }
  
  const tuples = records.map(r => `(
    ${fmt(r.Tabelle, true)},
    ${fmt(r.Datum, true)},
    ${fmt(r.ID_Code, true)},
    ${fmt(r.Program_Nr)},
    ${fmt(r.Program_Name, true)},
    ${fmt(r.Materialnummer, true)},
    ${fmt(r.Serialnummer, true)},
    ${fmt(r.Schraubkanal)},
    ${fmt(r.Ergebnis, true)},
    ${fmt(r.N_Letzter_Schritt)},
    ${fmt(r.P_Letzter_Schritt, true)},
    ${fmt(r.Drehmoment_Nom)},
    ${fmt(r.Drehmoment_Ist)},
    ${fmt(r.Drehmoment_Min)},
    ${fmt(r.Drehmoment_Max)},
    ${fmt(r.Winkel_Nom)},
    ${fmt(r.Winkel_Ist)},
    ${fmt(r.Winkel_Min)},
    ${fmt(r.Winkel_Max)},
    ${fmt(r.Winkelwerte, true)},
    ${fmt(r.Drehmomentwerte, true)}
  )`);
  
  return `INSERT INTO ${TARGET_TABLE} (
    Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis,
    N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max,
    Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
  )
  VALUES
  ${tuples.join(',\n')};`;
}

// ==================== Main Processing Function ====================

try {
  // Validate input
  if (!msg.payload) {
    throw new Error("Empty payload received");
  }
  
  // Determine controller type
  const payload = msg.payload;
  let records = [];
  
  // Check if this is a GH4 controller (has channels array)
  if (payload.channels && Array.isArray(payload.channels) && payload.channels.length > 0) {
    records = processGH4Controller(payload);
  } else {
    // This is a standard controller
    records = [processStandardController(payload)];
  }
  
  // Generate SQL INSERT statement
  msg.topic = generateSqlInsert(records);
  
  // Add processing metadata
  msg.processed = {
    source: payload.name || "Unknown",
    timestamp: new Date().toISOString(),
    recordsProcessed: records.length
  };
  
  return msg;
  
} catch (error) {
  // Handle any errors in the main processing
  node.error("Processing error: " + error.message);
  
  // Create an error message that will be sent to an error handling node
  msg.error = {
    message: error.message,
    timestamp: new Date().toISOString(),
    controller: msg.payload ? (msg.payload.name || "Unknown") : "unknown",
    payload: msg.payload // Include the original payload for debugging
  };
  
  // Clear the topic to prevent SQL execution
  msg.topic = null;
  
  return [null, msg]; // Send to second output if configured for error handling
}
