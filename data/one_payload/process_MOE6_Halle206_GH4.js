// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the GH4 controller
// Output: msg.topic contains the SQL INSERT statement

// Helper function to decode base64 graph data - improved version
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
    console.log("Error decoding base64 graph data:", e);
    return { angleValues: [], torqueValues: [] };
  }
}

// SQL formatter
const fmt = (v, str = false) => (v == null || v === '') ? 'NULL' : (str ? `'${v.toString().replace(/'/g, "''")}'` : v);

// Get data from msg.payload instead of file
const data = msg.payload;
const payloadName = data.name || "MOE6_Halle206_GH4";
const tuples = [];

// Process each channel
for (const ch of Array.isArray(data.channels) ? data.channels : []) {
  const tableTag = `${payloadName}_CH${ch.nr || ch['node id'] || 0}`;
  const Datum = new Date(ch.date || data.date)
    .toISOString().slice(0, 19).replace('T', ' ');
  const ID_Code = ch['id code'];
  const Program_Nr = ch['prg nr'];
  const Program_Name = ch['prg name'];
  const Zyklus = ch.cycle;
  const Schraubkanal = ch.nr || ch['node id'] || null;
  const Ergebnis = (ch.result || ch['quality code'] || '')
    .toString().trim().toUpperCase();

  // Steps
  const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
  const last = steps[steps.length - 1] || {};
  const N_Letzter_Schritt = last.row || null;
  const P_Letzter_Schritt = last.name || null;

  // Torque/Angle
  let Drehmoment_Nom = null, Drehmoment_Ist = null;
  const funcs = Array.isArray(last['tightening functions']) ? last['tightening functions'] : [];
  const torqueFn = funcs.find(f => f.name === 'TF Torque');
  const angleFn  = funcs.find(f => f.name === 'TF Angle');
  const finalFn  = torqueFn || angleFn;
  if (finalFn) { Drehmoment_Nom = finalFn.nom; Drehmoment_Ist = finalFn.act; }

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

  // Add to tuples array for multi-row INSERT
  tuples.push(`(
    ${fmt(tableTag,true)}, ${fmt(Datum,true)}, ${fmt(ID_Code,true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name,true)},
    ${fmt(Schraubkanal)}, ${fmt(Ergebnis,true)}, ${fmt(N_Letzter_Schritt)}, ${fmt(P_Letzter_Schritt,true)}, ${fmt(Zyklus)},
    ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, ${fmt(Winkelwerte,true)}, ${fmt(Drehmomentwerte,true)}
  )`);
}

// Set msg.topic to the SQL query instead of console.log
msg.topic = `INSERT INTO dbo.Auftraege (
  Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
  Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt, Zyklus,
  Drehmoment_Nom, Drehmoment_Ist, Winkelwerte, Drehmomentwerte
) VALUES
${tuples.join(',\n')};`;

return msg;
