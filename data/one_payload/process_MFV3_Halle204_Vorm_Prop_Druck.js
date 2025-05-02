#!/usr/bin/env node
// Tailored processor for payload -MFV3_Halle204_Vorm_Prop_Druck.json
const fs = require('fs');
const path = require('path');

// Helper to decode base64 graph data
function decodeGraphB64(graph) {
  const angleBuf = Buffer.from(graph['angle values'], 'base64');
  const torqueBuf = Buffer.from(graph['torque values'], 'base64');
  const angleValues = [];
  for (let i = 0; i < angleBuf.length; i += 4) angleValues.push(angleBuf.readInt32LE(i) / graph['angle scale']);
  const torqueValues = [];
  for (let i = 0; i < torqueBuf.length; i += 4) torqueValues.push(torqueBuf.readInt32LE(i) / graph['torque scale']);
  return { angleValues, torqueValues };
}

// Load payload
const payloadPath = path.resolve(__dirname, '-MFV3_Halle204_Vorm_Prop_Druck.json');
let ch;
try { ch = JSON.parse(fs.readFileSync(payloadPath, 'utf8')); }
catch (err) { console.error('Failed to load payload:', err); process.exit(1); }

// Identifiers
const payloadName = path.basename(payloadPath, '.json');
const tableTag = `${payloadName}_CH${ch.nr || ch['node id'] || 0}`;

// Common fields (use dateIso if available)
const Datum = new Date(ch.dateIso || ch.date).toISOString().slice(0,19).replace('T',' ');
const ID_Code = ch['id code'];
const Program_Nr = ch['prg nr'];
const Program_Name = ch['prg name'];
const Zyklus = ch.cycle;
const Schraubkanal = ch.nr || ch['node id'] || null;
const Ergebnis = (ch.result || ch['quality code'] || '').toString().trim().toUpperCase();

// Tightening steps
const steps = Array.isArray(ch['tightening steps']) ? ch['tightening steps'] : [];
const last = steps[steps.length-1] || {};
const N_Letzter_Schritt = last.row || null;
const P_Letzter_Schritt = last.name || null;

// Extract torque (or angle)
let Drehmoment_Nom = null, Drehmoment_Ist = null;
const funcs = Array.isArray(last['tightening functions']) ? last['tightening functions'] : [];
const torqueFn = funcs.find(f => f.name==='TF Torque');
const angleFn  = funcs.find(f => f.name==='TF Angle');
const finalFn  = torqueFn || angleFn;
if (finalFn) { Drehmoment_Nom = finalFn.nom; Drehmoment_Ist = finalFn.act; }

// Graph data (array or base64)
let Winkelwerte = null, Drehmomentwerte = null;
if (last.graph && Array.isArray(last.graph['angle values'])) {
  Winkelwerte = last.graph['angle values'].join(',');
  Drehmomentwerte = Array.isArray(last.graph['torque values']) ? last.graph['torque values'].join(',') : null;
} else if (last.graph_b64) {
  const { angleValues, torqueValues } = decodeGraphB64(last.graph_b64);
  Winkelwerte = angleValues.join(',');
  Drehmomentwerte = torqueValues.join(',');
}

// SQL formatter
const fmt = (v, str=false) => (v===undefined||v===null||v==='') ? 'NULL' : str ? `'${v.toString().replace(/'/g,"''")}'` : v;

// Build SQL
const sql = `INSERT INTO dbo.Auftraege (
  Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
  Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt, Zyklus,
  Drehmoment_Nom, Drehmoment_Ist, Winkelwerte, Drehmomentwerte
) VALUES (
  ${fmt(tableTag,true)}, ${fmt(Datum,true)}, ${fmt(ID_Code,true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name,true)},
  ${fmt(Schraubkanal)}, ${fmt(Ergebnis,true)}, ${fmt(N_Letzter_Schritt)}, ${fmt(P_Letzter_Schritt,true)}, ${fmt(Zyklus)},
  ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, ${fmt(Winkelwerte,true)}, ${fmt(Drehmomentwerte,true)}
);`;
console.log('--- SQL QUERY ---\n' + sql);

// Missing fields analysis
const missing = [];
const checkMissing = (v,label) => { if (v===undefined||v===null||v==='') missing.push(label); };
[
  [Datum,'Datum'],[ID_Code,'ID_Code'],[Program_Nr,'Program_Nr'],[Program_Name,'Program_Name'],
  [Zyklus,'Zyklus'],[Schraubkanal,'Schraubkanal'],[Ergebnis,'Ergebnis'],
  [N_Letzter_Schritt,'N_Letzter_Schritt'],[P_Letzter_Schritt,'P_Letzter_Schritt'],
  [Drehmoment_Nom,'Drehmoment_Nom'],[Drehmoment_Ist,'Drehmoment_Ist'],
  [Winkelwerte,'Winkelwerte'],[Drehmomentwerte,'Drehmomentwerte']
].forEach(([v,l]) => checkMissing(v,l));
const analysis = [{ channel: 0, missing }];
console.log('\n--- MISSING FIELDS ANALYSIS ---\n' + JSON.stringify(analysis,null,2));
