#!/usr/bin/env node
// Tailored processor for payload _MFV23_Halle101_114227CP_link.json
const fs = require('fs');
const path = require('path');

// Load payload
const payloadPath = path.resolve(__dirname, '_MFV23_Halle101_114227CP_link.json');
let ch;
try {
  ch = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
} catch (err) {
  console.error('Failed to load payload:', err);
  process.exit(1);
}

// Derive identifiers
const payloadName = path.basename(payloadPath, '.json');
const tableTag = `${payloadName}_CH${ch.nr || ch['node id'] || 0}`;

// Common fields
const Datum = new Date(ch.date).toISOString().slice(0,19).replace('T',' ');
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

// SQL formatting helper
const fmt = (v, str=false) => (v===undefined || v===null || v==='') ? 'NULL' : str ? `'${v.toString().replace(/'/g, "''")}'` : v;

// Build and output SQL
const sql = `INSERT INTO dbo.Auftraege (
  Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
  Schraubkanal, Ergebnis, N_Letzter_Schritt, P_Letzter_Schritt, Zyklus,
  Drehmoment_Nom, Drehmoment_Ist, Winkelwerte, Drehmomentwerte
) VALUES (
  ${fmt(tableTag, true)}, ${fmt(Datum, true)}, ${fmt(ID_Code, true)}, ${fmt(Program_Nr)}, ${fmt(Program_Name, true)},
  ${fmt(Schraubkanal)}, ${fmt(Ergebnis, true)}, ${fmt(N_Letzter_Schritt)}, ${fmt(P_Letzter_Schritt, true)}, ${fmt(Zyklus)},
  ${fmt(Drehmoment_Nom)}, ${fmt(Drehmoment_Ist)}, ${fmt(Winkelwerte, true)}, ${fmt(Drehmomentwerte, true)}
);`;

console.log('--- SQL QUERY ---\n' + sql);

// Missing fields analysis
const missing = [];
const checkMissing = (val, label) => { if (val===undefined || val===null || val==='') missing.push(label); };
[
  [Datum, 'Datum'],
  [ID_Code, 'ID_Code'],
  [Program_Nr, 'Program_Nr'],
  [Program_Name, 'Program_Name'],
  [Zyklus, 'Zyklus'],
  [Schraubkanal, 'Schraubkanal'],
  [Ergebnis, 'Ergebnis'],
  [N_Letzter_Schritt, 'N_Letzter_Schritt'],
  [P_Letzter_Schritt, 'P_Letzter_Schritt'],
  [Drehmoment_Nom, 'Drehmoment_Nom'],
  [Drehmoment_Ist, 'Drehmoment_Ist'],
  [Winkelwerte, 'Winkelwerte'],
  [Drehmomentwerte, 'Drehmomentwerte']
].forEach(([val,label]) => checkMissing(val,label));
const analysis = [{ channel: 0, missing }];
console.log('\n--- MISSING FIELDS ANALYSIS ---\n' + JSON.stringify(analysis, null, 2));
