// Node-RED–ready processor for MFV3_Halle204_Vorm_Prop_Druck

// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the MFV3 controller
// Output: msg.topic contains the SQL INSERT statement
//         If successful, msg.payload remains unchanged
//         If error, msg.error contains error details and msg.payload remains unchanged

// SQL formatting helper
const fmt = (v, str=false) => (v===undefined || v===null || v==='') ? 'NULL' : str ? `'${v.toString().replace(/'/g, "''")}'` : v;

// Helper function to decode base64 graph data
function decodeGraphB64(graph) {
  if (!graph) return { angleValues: [], torqueValues: [] };
  
  try {
    const angleBuf = Buffer.from(graph['angle values'], 'base64');
    const torqueBuf = Buffer.from(graph['torque values'], 'base64');
    const angleValues = [];
    const torqueValues = [];
    
    const angleScale = graph['angle scale'] || 1;
    const torqueScale = graph['torque scale'] || 1;
    
    for (let i = 0; i < angleBuf.length; i += 4) {
      angleValues.push(angleBuf.readInt32LE(i) / angleScale);
    }
    
    for (let i = 0; i < torqueBuf.length; i += 4) {
      torqueValues.push(torqueBuf.readInt32LE(i) / torqueScale);
    }
    
    return { angleValues, torqueValues };
  } catch (e) {
    node.error("Error decoding base64 graph data: " + e.message);
    return { angleValues: [], torqueValues: [] };
  }
}

// Helper function to extract material and serial number from ID code
function extractMaterialAndSerial(idCode) {
  if (!idCode) return { material: null, serial: null };
  
  // For standard controllers, we don't have material/serial information
  // Only the GH4 controller has this information embedded in the ID code
  return { material: null, serial: null };
}

// Main processing function with error handling
try {
  const TARGET_TABLE = 'dbo.Auftraege';
  
  // Validate input
  if (!msg.payload) {
    throw new Error("Empty payload received");
  }
  
  // Get data from msg.payload
  const ch = msg.payload;
  const payloadName = ch.name || "MFV3_Halle204_Vorm_Prop_Druck";
  // Removed channel suffix from tableTag to prevent truncation in database
  const tableTag = payloadName;
  
  // Validate required fields
  if (!ch.date) {
    node.warn("Payload missing date, using current time");
  }
  
  if (!ch['id code']) {
    throw new Error("Payload missing ID code");
  }
  
  // Common fields
  const Datum = new Date(ch.dateIso || ch.date || new Date()).toISOString().slice(0,19).replace('T',' ');
  const ID_Code = ch['id code'];
  
  // Extract material and serial number
  const { material, serial } = extractMaterialAndSerial(ID_Code);
  const Materialnummer = material;
  const Serialnummer = serial;
  
  const Program_Nr = ch['prg nr'];
  const Program_Name = ch['prg name'];
  // Zyklus removed as requested
  const Schraubkanal = ch.nr || ch['node id'] || ch.channel || null;
  const Ergebnis = (ch.result || ch['quality code'] || '').toString().trim().toUpperCase();
  
  // Validate tightening steps
  const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
  if (steps.length === 0) {
    node.warn("Payload has no tightening steps, using defaults");
  }
  
  const last = steps[steps.length-1] || {};
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
  
  // Graph arrays
  let Winkelwerte = null, Drehmomentwerte = null;
  if (last.graph && Array.isArray(last.graph['angle values'])) {
    Winkelwerte = last.graph['angle values'].join(',');
    Drehmomentwerte = Array.isArray(last.graph['torque values']) ? last.graph['torque values'].join(',') : null;
  } else if (last.graph_b64) {
    const { angleValues, torqueValues } = decodeGraphB64(last.graph_b64);
    Winkelwerte = angleValues.join(',');
    Drehmomentwerte = torqueValues.join(',');
  }
  
  // Build and output SQL - removed Zyklus
  msg.topic = `INSERT INTO ${TARGET_TABLE} (
    Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max, Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
  ) VALUES (
    ${fmt(tableTag, true)}, ${fmt(Datum, true)}, ${fmt(ID_Code, true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name, true)},
    ${fmt(Materialnummer, true)}, ${fmt(Serialnummer, true)}, ${fmt(Schraubkanal)}, ${fmt(Ergebnis, true)}, ${fmt(N_Letzter_Schritt)}, ${fmt(P_Letzter_Schritt, true)},
    ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, ${fmt(Drehmoment_Min)}, ${fmt(Drehmoment_Max)}, ${fmt(Winkel_Nom)}, ${fmt(Winkel_Ist)}, ${fmt(Winkel_Min)}, ${fmt(Winkel_Max)},
    ${fmt(Winkelwerte, true)}, ${fmt(Drehmomentwerte, true)}
  );`;
  
  // Add processing metadata
  msg.processed = {
    controller: payloadName,
    timestamp: new Date().toISOString(),
    idCode: ID_Code
  };
  
  return msg;
  
} catch (error) {
  // Handle any errors in the main processing
  node.error("Processing error: " + error.message);
  
  // Create an error message that will be sent to an error handling node
  msg.error = {
    message: error.message,
    timestamp: new Date().toISOString(),
    controller: 'MFV3_Halle204_Vorm_Prop_Druck',
    payload: msg.payload // Include the original payload for debugging
  };
  
  // Clear the topic to prevent SQL execution
  msg.topic = null;
  
  return [null, msg]; // Send to second output if configured for error handling
}
