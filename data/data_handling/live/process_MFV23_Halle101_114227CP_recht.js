// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the MFV23 controller
// Output: msg.topic contains the SQL INSERT statement

// SQL formatting helper
const fmt = (v, str=false) => (v===undefined || v===null || v==='') ? 'NULL' : str ? `'${v.toString().replace(/'/g, "''")}'` : v;

// Get data from msg.payload
const ch = msg.payload;
const payloadName = ch.name || "MFV23_Halle101_114227CP_recht";
// Removed channel suffix from tableTag to prevent truncation in database
const tableTag = payloadName;

// Common fields
const Datum = new Date(ch.date).toISOString().slice(0,19).replace('T',' ');
const ID_Code = ch['id code'];
const Program_Nr = ch['prg nr'];
const Program_Name = ch['prg name'];
// Zyklus removed as requested
const Schraubkanal = ch.nr || ch['node id'] || null;
const Ergebnis = (ch.result || ch['quality code'] || '').toString().trim().toUpperCase();

// Tightening steps
const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
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
msg.topic = `INSERT INTO dbo.Auftraege (
  Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
  Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt,
  Drehmoment_Nom, Drehmoment_Ist, Winkelwerte, Drehmomentwerte
) VALUES (
  ${fmt(tableTag, true)}, ${fmt(Datum, true)}, ${fmt(ID_Code, true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name, true)},
  ${fmt(Schraubkanal)}, ${fmt(Ergebnis, true)}, ${fmt(N_Letzter_Schritt)}, ${fmt(P_Letzter_Schritt, true)},
  ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, ${fmt(Winkelwerte, true)}, ${fmt(Drehmomentwerte, true)}
);`;

return msg;
