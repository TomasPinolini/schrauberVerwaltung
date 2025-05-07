/**
 * Unified Processor for Schrauber Data
 * 
 * This is a consolidated processor that can handle all controller types:
 * - Standard controllers (MFV3, MFV23, MOE61)
 * - GH4 controller (MOE6_Halle206_GH4/MOE61_Halle206_GH4)
 * 
 * Features:
 * - Handles both single and multi-channel payloads
 * - Supports all known field naming variations
 * - Processes both array and base64 encoded graph data
 * - Extracts material and serial numbers from ID codes when available
 * - Robust field extraction with fallbacks
 * - Detailed error handling and reporting
 * 
 * Usage in Node-RED:
 * 1. Create a function node
 * 2. Paste this entire file as the function code
 * 3. Connect input to your MQTT/HTTP source
 * 4. Connect output to your database node
 */

// Target database table
const TARGET_TABLE = "dbo.Auftraege";

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
function isoDatetime(v) {
  if (!v) return null;
  try {
    return new Date(v).toISOString().slice(0, 19).replace('T', ' ');
  } catch (e) {
    node.warn(`Invalid date format: ${v}`);
    return null;
  }
}

/**
 * Flexible field getter that tries multiple keys and objects
 * @param {Object|Array} objs - Object or array of objects to search in
 * @param {Array} keys - Array of possible key names
 * @param {*} fallback - Default value if not found
 * @param {boolean} ignoreCase - Whether to ignore case when matching keys
 * @returns {*} Found value or fallback
 */
function getField(objs, keys, fallback = null, ignoreCase = true) {
  if (!Array.isArray(objs)) objs = [objs];
  for (const obj of objs) {
    if (!obj) continue;
    for (const k of keys) {
      // Exact match
      if (obj[k] !== undefined) return obj[k];
      // Case-insensitive + whitespace-insensitive match
      if (ignoreCase) {
        const foundKey = Object.keys(obj).find(
          key => key.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, '')
        );
        if (foundKey && obj[foundKey] !== undefined) return obj[foundKey];
      }
    }
  }
  return fallback;
}

/**
 * Extract material and serial number from ID code
 * @param {string} idCode - ID code string
 * @returns {Object} Object with material and serial properties
 */
function extractMaterialAndSerial(idCode) {
  if (!idCode) return { material: null, serial: null };
  
  try {
    // GH4 format: "R901450936-1108_001" where R901450936 is material number and 001 is serial
    if (idCode.includes('-') && idCode.includes('_')) {
      // Material is the part before the first dash
      const materialPart = idCode.split('-')[0];
      
      // Serial is the part after the last underscore
      const lastUnderscoreIndex = idCode.lastIndexOf('_');
      const serialPart = lastUnderscoreIndex !== -1 ? idCode.substring(lastUnderscoreIndex + 1) : null;
      
      return {
        material: materialPart || null,
        serial: serialPart || null
      };
    }
    
    // Standard format: "L 000000151112" - no material/serial extraction
    return { material: null, serial: null };
  } catch (e) {
    node.warn(`Error extracting material and serial: ${e.message}`);
    return { material: null, serial: null };
  }
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
    
    // Use scale if provided, default to 1
    const angleScale = graph['angle scale'] || 1;
    const torqueScale = graph['torque scale'] || 1;
    
    // Read values as 32-bit little-endian integers and apply scaling
    for (let i = 0; i < angleBuf.length; i += 4) {
      if (i + 3 < angleBuf.length) { // Ensure we have enough bytes
        angleValues.push(angleBuf.readInt32LE(i) / angleScale);
      }
    }
    
    for (let i = 0; i < torqueBuf.length; i += 4) {
      if (i + 3 < torqueBuf.length) { // Ensure we have enough bytes
        torqueValues.push(torqueBuf.readInt32LE(i) / torqueScale);
      }
    }
    
    return { angleValues, torqueValues };
  } catch (e) {
    node.warn(`Error decoding base64 graph data: ${e.message}`);
    return { angleValues: [], torqueValues: [] };
  }
}

// ==================== Main Processing Function ====================

try {
  // Validate input
  if (!msg.payload) {
    throw new Error("Empty payload received");
  }
  
  // Normalize input - always treat as array of channels, even if single object
  const root = Array.isArray(msg.payload) ? msg.payload[0] : msg.payload;
  const channels = root.channels?.length ? root.channels : [root];
  
  // Extract common fields from root level
  const baseName = getField(root, ["Table", "table", "name", "appl name", "tablename", "tabelle"], 'Unknown');
  const idCode = getField(root, ["id code", "id_code", "id code channel", "idcode"]);
  const progNr = getField(root, ["appl nr", "prg nr", "program nr", "applnr", "prgnr"]);
  const progName = getField(root, ["appl name", "prg name", "program name", "applname", "prgname"]);
  const datum = isoDatetime(getField(root, ["date", "dateIso", "prg date", "datum", "datetime"]));
  const ergebnis = (getField(root, ["result", "quality code", "ergebnis", "oknok"], '') || '').toString().toUpperCase();
  
  // Extract material and serial number from ID code
  const { material, serial } = extractMaterialAndSerial(idCode);
  
  // Prepare for multi-row INSERT
  const tuples = [];
  const errors = [];
  const warnings = [];
  
  // Process each channel
  channels.forEach((ch, idx) => {
    try {
      // Handle controller type naming correction (MOE6_Halle206_GH4 -> MOE61_Halle206_GH4)
      let tableTag = channels.length === 1
        ? (baseName || getField(ch, ["Table", "table", "name", "appl name"], 'Unknown'))
        : `${baseName}_CH${getField(ch, ["nr", "node id", "channel"], idx + 1)}`;
      
      // Correct controller name if needed
      if (tableTag === 'MOE6_Halle206_GH4') {
        tableTag = 'MOE61_Halle206_GH4';
      }
      
      // Get tightening steps - try channel level first, then root
      const steps = getField([ch, root], ["tightening steps"], []);
      if (!Array.isArray(steps) || steps.length === 0) {
        warnings.push(`Channel ${idx + 1}: No tightening steps found`);
      }
      
      // Get the last step (most important for final values)
      const last = steps.length > 0 ? steps[steps.length - 1] : {};
      
      // Initialize record with all possible fields
      const r = {
        Table: tableTag,
        Datum: isoDatetime(getField([ch, root], ["date", "dateIso", "prg date", "datum", "datetime"])),
        ID_Code: getField([ch, root], ["id code", "id_code", "id code channel", "idcode"]),
        Program_Nr: getField([ch, root], ["appl nr", "prg nr", "program nr", "applnr", "prgnr"]),
        Program_Name: getField([ch, root], ["appl name", "prg name", "program name", "applname", "prgname"]),
        Materialnummer: material,
        Serialnummer: serial,
        Schraubkanal: getField(ch, ["nr", "node id", "channel"]),
        Ergebnis: (getField([ch, root], ["result", "quality code", "ergebnis", "oknok"], '') || '').toString().toUpperCase(),
        N_Letzter_Schritt: getField([last, ch], ["row", "step row", "n_letzter_schritt"]),
        P_Letzter_Schritt: getField([last, ch], ["name", "column", "step name", "p_letzter_schritt"]),
        Drehmoment_Nom: null,
        Drehmoment_Ist: null,
        Drehmoment_Min: null,
        Drehmoment_Max: null,
        Winkel_Nom: null,
        Winkel_Ist: null,
        Winkel_Min: null,
        Winkel_Max: null,
        Winkelwerte: null,
        Drehmomentwerte: null
      };
      
      // Required fields validation
      if (!r.ID_Code) {
        warnings.push(`Channel ${idx + 1}: Missing ID_Code`);
      }
      
      if (!r.Datum) {
        r.Datum = isoDatetime(new Date()); // Use current time as fallback
        warnings.push(`Channel ${idx + 1}: Missing date, using current time`);
      }
      
      // Extract tightening function values from all steps (not just last)
      // This handles cases where values might be in intermediate steps
      const allFunctions = [];
      steps.forEach(step => {
        if (Array.isArray(step["tightening functions"])) {
          allFunctions.push(...step["tightening functions"]);
        }
      });
      
      // If no functions found in steps, try direct access to last step
      const lastStepFunctions = Array.isArray(last["tightening functions"]) ? last["tightening functions"] : [];
      if (allFunctions.length === 0 && lastStepFunctions.length > 0) {
        allFunctions.push(...lastStepFunctions);
      }
      
      // Process all tightening functions to extract values
      allFunctions.forEach(fn => {
        if (!fn || !fn.name) return;
        
        const name = fn.name.trim();
        switch (name) {
          case 'TF Torque':
            r.Drehmoment_Nom = fn.nom;
            r.Drehmoment_Ist = fn.act;
            break;
          case 'MF TorqueMin':
            r.Drehmoment_Min = fn.nom;
            break;
          case 'MF TorqueMax':
          case 'MFs TorqueMax':
            r.Drehmoment_Max = fn.nom;
            break;
          case 'TF Angle':
          case 'TF Yield Point':
            r.Winkel_Nom = fn.nom;
            r.Winkel_Ist = fn.act;
            break;
          case 'MF AngleMin':
          case 'MFs AngleMin':
            r.Winkel_Min = fn.nom;
            break;
          case 'MF AngleMax':
          case 'MFs AngleMax':
            r.Winkel_Max = fn.nom;
            break;
        }
        
        // Some controllers have angle threshold in add array
        if (fn.add && Array.isArray(fn.add) && fn.add.length > 0) {
          const angleThreshold = fn.add[0]["angle threshold"];
          if (angleThreshold) {
            r.Winkel_Nom = angleThreshold.nom ?? r.Winkel_Nom;
            r.Winkel_Ist = angleThreshold.act ?? r.Winkel_Ist;
          }
        }
      });
      
      // Graph data extraction (supports both base64 and array formats)
      // Try multiple locations: channel level, last step, root level
      let graphData = getField([ch, last, root], ["graph_b64"]);
      let graphArr = getField([ch, last, root], ["graph"]);
      
      // Process graph data if available or if result is NOK (important for analysis)
      if (r.Ergebnis === 'NOK' || graphData || graphArr) {
        if (graphData) {
          // Handle base64 encoded graph data
          const { angleValues, torqueValues } = decodeGraphB64(graphData);
          r.Winkelwerte = angleValues.length > 0 ? angleValues.join(',') : null;
          r.Drehmomentwerte = torqueValues.length > 0 ? torqueValues.join(',') : null;
        } else if (graphArr) {
          // Handle array format graph data
          r.Winkelwerte = Array.isArray(graphArr["angle values"]) ? graphArr["angle values"].join(',') : null;
          r.Drehmomentwerte = Array.isArray(graphArr["torque values"]) ? graphArr["torque values"].join(',') : null;
        }
      }
      
      // Add to tuples array for multi-row INSERT
      tuples.push(`(
        ${fmt(r.Table, true)},
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
    } catch (channelError) {
      // Log error but continue processing other channels
      errors.push(`Error processing channel ${idx + 1}: ${channelError.message}`);
    }
  });
  
  // Check if we have any valid tuples
  if (tuples.length === 0) {
    throw new Error("No valid data extracted from payload");
  }
  
  // Generate SQL INSERT statement
  msg.topic = `
INSERT INTO ${TARGET_TABLE} (
    Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis,
    N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max,
    Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
)
VALUES
${tuples.join(',\n')};`;
  
  // Add processing metadata
  msg.processed = {
    controller: baseName,
    timestamp: new Date().toISOString(),
    channelsProcessed: tuples.length,
    totalChannels: channels.length,
    warnings: warnings.length > 0 ? warnings : undefined
  };
  
  // Log warnings to Node-RED
  warnings.forEach(warning => {
    node.warn(warning);
  });
  
  return msg;
  
} catch (error) {
  // Handle any errors in the main processing
  node.error("Processing error: " + error.message);
  
  // Create an error message that will be sent to an error handling node
  msg.error = {
    message: error.message,
    timestamp: new Date().toISOString(),
    controller: msg.payload ? getField(msg.payload, ["name", "Table", "table", "appl name"], "unknown") : "unknown",
    payload: msg.payload // Include the original payload for debugging
  };
  
  // Clear the topic to prevent SQL execution
  msg.topic = null;
  
  return [null, msg]; // Send to second output if configured for error handling
}
