// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the MFV23 controller
// Output: msg.topic contains the SQL INSERT statement
//         If successful, msg.payload remains unchanged
//         If error, msg.error contains error details and msg.payload remains unchanged

// SQL formatting helper
const fmt = (v, str=false) => (v===undefined || v===null || v==='') ? 'NULL' : str ? `'${v.toString().replace(/'/g, "''")}'` : v;

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
  const payloadName = ch.name || "MFV23_Halle101_114227CP_link";
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
  const Schraubkanal = ch.nr || ch['node id'] || null;
  const Ergebnis = (ch.result || ch['quality code'] || '').toString().trim().toUpperCase();
  
  // Validate tightening steps
  const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
  if (steps.length === 0) {
    node.warn("Payload has no tightening steps, using defaults");
  }
  
  const last = steps[steps.length-1] || {};
  const N_Letzter_Schritt = last.row || null;
  const P_Letzter_Schritt = last.name || null;
  
  // Extract torque (or angle) from last step functions
  let Drehmoment_Nom = null, Drehmoment_Ist = null;
  const funcs = Array.isArray(last['tightening functions']) ? last['tightening functions'] : [];
  const torqueFn = funcs.find(f => f.name === 'TF Torque');
  const angleFn  = funcs.find(f => f.name === 'TF Angle');
  const finalFn  = torqueFn || angleFn;
  if (finalFn) {
    Drehmoment_Nom = finalFn.nom;
    Drehmoment_Ist = finalFn.act;
  }
  
  // Graph arrays
  let Winkelwerte = null, Drehmomentwerte = null;
  if (last.graph && Array.isArray(last.graph['angle values'])) {
    Winkelwerte = last.graph['angle values'].join(',');
    Drehmomentwerte = Array.isArray(last.graph['torque values']) ? last.graph['torque values'].join(',') : null;
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
    ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, NULL, NULL, NULL, NULL, NULL, NULL,
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
    controller: 'MFV23_Halle101_114227CP_link',
    payload: msg.payload // Include the original payload for debugging
  };
  
  // Clear the topic to prevent SQL execution
  msg.topic = null;
  
  return [null, msg]; // Send to second output if configured for error handling
}
