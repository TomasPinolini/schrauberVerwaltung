// Node-RED–ready processor for MFV3_Halle204_Vorm_Prop_Druck

// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the MFV3 controller
// Output: msg.topic contains the SQL INSERT statement
//         If successful, msg.payload remains unchanged
//         If error, msg.error contains error details and msg.payload remains unchanged

// Helper function to decode base64 graph data - improved version
function decodeBase64OrArray(graph) {
  if (!graph) return { angleValues: [], torqueValues: [] };
  
  // Handle angle values
  let angleValues = [];
  if (Array.isArray(graph['angle values'])) {
    angleValues = graph['angle values'];
  } else if (typeof graph['angle values'] === 'string') {
    try {
      const buf = Buffer.from(graph['angle values'], 'base64');
      const scale = graph['angle scale'] || 1;
      if (buf.length % 4 === 0) {
        for (let i = 0; i < buf.length; i += 4) {
          angleValues.push(buf.readInt32LE(i) / scale); // Note: using Int32LE instead of FloatLE
        }
      }
    } catch (e) { 
      node.warn("Error decoding angle values: " + e.message);
    }
  }
  
  // Handle torque values
  let torqueValues = [];
  if (Array.isArray(graph['torque values'])) {
    torqueValues = graph['torque values'];
  } else if (typeof graph['torque values'] === 'string') {
    try {
      const buf = Buffer.from(graph['torque values'], 'base64');
      const scale = graph['torque scale'] || 1;
      if (buf.length % 4 === 0) {
        for (let i = 0; i < buf.length; i += 4) {
          torqueValues.push(buf.readInt32LE(i) / scale); // Note: using Int32LE instead of FloatLE
        }
      }
    } catch (e) {
      node.warn("Error decoding torque values: " + e.message);
    }
  }
  
  return { angleValues, torqueValues };
}

// Helper function to extract material and serial number from ID code
function extractMaterialAndSerial(idCode) {
  if (!idCode) return { material: null, serial: null };
  
  // For standard controllers, we don't have material/serial information
  // Only the GH4 controller has this information embedded in the ID code
  return { material: null, serial: null };
}

// SQL formatter
const fmt = (v, str = false) => (v == null || v === '') ? 'NULL' : (str ? `'${v.toString().replace(/'/g, "''")}'` : v);

// Main processing function with error handling
try {
  const TARGET_TABLE = 'dbo.Auftraege';
  
  // Validate input
  if (!msg.payload) {
    throw new Error("Empty payload received");
  }
  
  const payloadName = msg.payload.name || 'MFV3_Halle204_Vorm_Prop_Druck';
  
  // Get data from msg.payload
  const ch = msg.payload;
  
  // Validate required fields
  if (!ch.date && !ch.dateIso) {
    node.warn("Payload missing date, using current time");
  }
  
  if (!ch['id code']) {
    throw new Error("Payload missing ID code");
  }
  
  // derive
  const tableTag = payloadName;
  const Datum = new Date(ch.dateIso || ch.date || new Date()).toISOString().slice(0, 19).replace('T', ' ');
  const ID_Code = ch['id code'];
  
  // Extract material and serial number
  const { material, serial } = extractMaterialAndSerial(ID_Code);
  const Materialnummer = material;
  const Serialnummer = serial;
  
  const Program_Nr = ch['prg nr'];
  const Program_Name = ch['prg name'];
  // Zyklus field removed as requested
  const Schraubkanal = ch.nr || ch['node id'] || null;
  const Ergebnis = (ch.result || ch['quality code'] || '').toString().trim().toUpperCase();
  
  // Validate tightening steps
  const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
  if (steps.length === 0) {
    node.warn("Payload has no tightening steps, using defaults");
  }
  
  const last = steps[steps.length - 1] || {};
  const N_Letz = last.row || null;
  const P_Letz = last.name || null;
  
  // torque/angle
  let Drehmoment_Nom = null, Drehmoment_Ist = null;
  const funcs = Array.isArray(last['tightening functions']) ? last['tightening functions'] : [];
  const fTor = funcs.find(f => f.name === 'TF Torque');
  const fAng = funcs.find(f => f.name === 'TF Angle');
  const finf = fTor || fAng;
  if (finf) { Drehmoment_Nom = finf.nom; Drehmoment_Ist = finf.act; }
  
  // graph
  let Winkelwerte = null, Drehmomentwerte = null;
  if (last.graph && Array.isArray(last.graph['angle values'])) {
    Winkelwerte = last.graph['angle values'].join(',');
    Drehmomentwerte = Array.isArray(last.graph['torque values']) ? last.graph['torque values'].join(',') : null;
  } else if (last.graph_b64) {
    const { angleValues, torqueValues } = decodeBase64OrArray(last.graph_b64);
    Winkelwerte = angleValues.join(',');
    Drehmomentwerte = torqueValues.join(',');
  }
  
  // sql - updated to match the exact structure of the original table
  msg.topic = `INSERT INTO ${TARGET_TABLE} (
    Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max, Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
  ) VALUES (
    ${fmt(tableTag,true)}, ${fmt(Datum,true)}, ${fmt(ID_Code,true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name,true)},
    ${fmt(Materialnummer,true)}, ${fmt(Serialnummer,true)}, ${fmt(Schraubkanal)}, ${fmt(Ergebnis,true)}, ${fmt(N_Letz)}, ${fmt(P_Letz,true)},
    ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, NULL, NULL, NULL, NULL, NULL, NULL,
    ${fmt(Winkelwerte,true)}, ${fmt(Drehmomentwerte,true)}
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
