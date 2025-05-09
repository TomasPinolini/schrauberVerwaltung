// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the GH4 controller
// Output: msg.topic contains the SQL INSERT statement
//         If successful, msg.payload remains unchanged
//         If error, msg.error contains error details and msg.payload remains unchanged

// Helper function to decode base64 graph data - fixed version to match Python implementation
function decodeGraphB64(graph) {
  if (!graph) return { angleValues: [], torqueValues: [] };
  
  try {
    const angleBuf = Buffer.from(graph['angle values'], 'base64');
    const torqueBuf = Buffer.from(graph['torque values'], 'base64');
    const angleValues = [];
    const torqueValues = [];
    
    // Default scale values if not provided
    const angleScale = graph['angle scale'] || 10000;
    const torqueScale = graph['torque scale'] || 100000;
    
    // Read 16-bit signed integers (Int16) instead of 32-bit
    for (let i = 0; i < angleBuf.length; i += 2) {
      // readInt16LE reads a 16-bit signed integer (2 bytes)
      angleValues.push(angleBuf.readInt16LE(i) / angleScale);
    }
    
    for (let i = 0; i < torqueBuf.length; i += 2) {
      // readInt16LE reads a 16-bit signed integer (2 bytes)
      torqueValues.push(torqueBuf.readInt16LE(i) / torqueScale);
    }
    
    // Log the first few values for debugging
    node.log(`First 5 angle values: ${angleValues.slice(0, 5).join(', ')}`);
    node.log(`First 5 torque values: ${torqueValues.slice(0, 5).join(', ')}`);
    
    return { angleValues, torqueValues };
  } catch (e) {
    node.error("Error decoding base64 graph data: " + e.message);
    return { angleValues: [], torqueValues: [] };
  }
}

// Helper function to extract material and serial number from ID code
function extractMaterialAndSerial(idCode) {
  if (!idCode) return { material: null, serial: null };
  
  try {
    // Expected format: "R901450936-1108_001" where R901450936 is material number and 001 is serial
    // Material is the part before the first dash
    const materialPart = idCode.split('-')[0];
    
    // Serial is the part after the last underscore (always the last number)
    const lastUnderscoreIndex = idCode.lastIndexOf('_');
    const serialPart = lastUnderscoreIndex !== -1 ? idCode.substring(lastUnderscoreIndex + 1) : null;
    
    return {
      material: materialPart || null,
      serial: serialPart || null
    };
  } catch (e) {
    node.error("Error extracting material and serial: " + e.message);
    return { material: null, serial: null };
  }
}

// SQL formatter
const fmt = (v, str = false) => (v == null || v === '') ? 'NULL' : (str ? `'${v.toString().replace(/'/g, "''")}'` : v);

// Main processing function with error handling
try {
  // Validate input
  if (!msg.payload) {
    throw new Error("Empty payload received");
  }
  
  // Get data from msg.payload
  const data = msg.payload;
  const payloadName = data.name || "MOE61_Halle206_GH4";
  const tuples = [];
  
  // Validate channels
  if (!data.channels || !Array.isArray(data.channels) || data.channels.length === 0) {
    throw new Error("No channels found in payload");
  }
  
  // Process each channel
  for (const ch of data.channels) {
    try {
      // Validate required fields
      if (!ch.date && !data.date) {
        node.warn(`Channel missing date, using current time`);
      }
      
      // Removed channel suffix from tableTag to prevent truncation in database
      const tableTag = payloadName;
      const Datum = new Date(ch.date || data.date || new Date())
        .toISOString().slice(0, 19).replace('T', ' ');
      const ID_Code = ch['id code'];
      
      if (!ID_Code) {
        node.warn(`Channel missing ID code, skipping`);
        continue;
      }
      
      // Extract material and serial number from ID code
      const { material, serial } = extractMaterialAndSerial(ID_Code);
      const Materialnummer = material;
      const Serialnummer = serial;
      
      const Program_Nr = ch['prg nr'];
      const Program_Name = ch['prg name'];
      const Schraubkanal = ch.nr || ch['node id'] || null;
      const Ergebnis = (ch.result || ch['quality code'] || '')
        .toString().trim().toUpperCase();
    
      // Steps
      const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
      if (steps.length === 0) {
        node.warn(`Channel ${Schraubkanal} has no tightening steps, using defaults`);
      }
      
      const last = steps[steps.length - 1] || {};
      const N_Letzter_Schritt = last.row || null;
      const P_Letzter_Schritt = last.name || null;
    
      // Extract torque and angle values from last step functions
      let Drehmoment_Nom = null, Drehmoment_Ist = null;
      let Drehmoment_Min = null, Drehmoment_Max = null;
      let Winkel_Nom = null, Winkel_Ist = null;
      let Winkel_Min = null, Winkel_Max = null;
      
      const funcs = Array.isArray(last['tightening functions']) ? last['tightening functions'] : [];
      
      // Find the torque and angle functions
      const torqueFn = funcs.find(f => f.name === 'TF Torque');
      const angleFn = funcs.find(f => f.name === 'TF Angle' || f.name === 'TF Yield Point');
      
      // Extract torque values
      if (torqueFn) {
        Drehmoment_Nom = torqueFn.nom;
        Drehmoment_Ist = torqueFn.act;
      }
      
      // Extract angle values
      if (angleFn) {
        Winkel_Nom = angleFn.nom;
        Winkel_Ist = angleFn.act;
      }
      
      // Extract min/max values
      const torqueMinFn = funcs.find(f => f.name === 'MF TorqueMin');
      if (torqueMinFn) {
        Drehmoment_Min = torqueMinFn.nom;
      }
      
      // Check both variants of TorqueMax
      const torqueMaxFn = funcs.find(f => f.name === 'MF TorqueMax' || f.name === 'MFs TorqueMax');
      if (torqueMaxFn) {
        Drehmoment_Max = torqueMaxFn.nom;
      }
      
      // Check both variants of AngleMin
      const angleMinFn = funcs.find(f => f.name === 'MF AngleMin' || f.name === 'MFs AngleMin');
      if (angleMinFn) {
        Winkel_Min = angleMinFn.nom;
      }
      
      // Check both variants of AngleMax
      const angleMaxFn = funcs.find(f => f.name === 'MF AngleMax' || f.name === 'MFs AngleMax');
      if (angleMaxFn) {
        Winkel_Max = angleMaxFn.nom;
      }
    
      // Graph
      let Winkelwerte = null, Drehmomentwerte = null;
      if (last.graph && Array.isArray(last.graph['angle values'])) {
        Winkelwerte = last.graph['angle values'].join(',');
        Drehmomentwerte = Array.isArray(last.graph['torque values'])
          ? last.graph['torque values'].join(',') : null;
      } else if (last.graph_b64) {
        const { angleValues, torqueValues } = decodeGraphB64(last.graph_b64);
        Winkelwerte = angleValues.join(',');
        Drehmomentwerte = torqueValues.join(',');
      }
    
      // Add to tuples array for multi-row INSERT - now includes Material and SerialNr
      tuples.push(`(
        ${fmt(tableTag,true)}, ${fmt(Datum,true)}, ${fmt(ID_Code,true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name,true)},
        ${fmt(Materialnummer,true)}, ${fmt(Serialnummer,true)}, ${fmt(Schraubkanal)}, ${fmt(Ergebnis,true)}, ${fmt(N_Letzter_Schritt)}, ${fmt(P_Letzter_Schritt,true)},
        ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, ${fmt(Drehmoment_Min)}, ${fmt(Drehmoment_Max)}, ${fmt(Winkel_Nom)}, ${fmt(Winkel_Ist)}, ${fmt(Winkel_Min)}, ${fmt(Winkel_Max)},
        ${fmt(Winkelwerte,true)}, ${fmt(Drehmomentwerte,true)}
      )`);
    } catch (channelError) {
      // Log error but continue processing other channels
      node.error(`Error processing channel: ${channelError.message}`);
    }
  }
  
  // Check if we have any valid tuples
  if (tuples.length === 0) {
    throw new Error("No valid data extracted from payload");
  }
  
  // Set msg.topic to the SQL query
  msg.topic = `INSERT INTO dbo.Auftraege (
    Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max, Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
  ) VALUES
  ${tuples.join(',\n')};`;
  
  // Add processing metadata
  msg.processed = {
    controller: payloadName,
    timestamp: new Date().toISOString(),
    channelsProcessed: tuples.length,
    totalChannels: data.channels ? data.channels.length : 0
  };
  
  return msg;
  
} catch (error) {
  // Handle any errors in the main processing
  node.error("Processing error: " + error.message);
  
  // Create an error message that will be sent to an error handling node
  msg.error = {
    message: error.message,
    timestamp: new Date().toISOString(),
    controller: msg.payload ? (msg.payload.name || "MOE61_Halle206_GH4") : "unknown",
    payload: msg.payload // Include the original payload for debugging
  };
  
  // Clear the topic to prevent SQL execution
  msg.topic = null;
  
  return [null, msg]; // Send to second output if configured for error handling
}
