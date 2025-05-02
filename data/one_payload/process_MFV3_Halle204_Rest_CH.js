#!/usr/bin/env node
// Node-RED–ready processor for MFV3_Halle204_Rest_CH
const { decodeBase64OrArray } = require('../function.js');
const TARGET_TABLE = 'dbo.Auftraege';
// payloadName hardcoded for table tag
const payloadName = 'MFV3_Halle204_Rest_CH';

/**
 * Build msg.topic SQL from msg.payload JSON
 * @param {{payload:object}} msg
 * @returns {{topic:string,payload:object}}
 */
function processPayload(msg) {
  const ch = msg.payload;
  const fmt = (v,str=false) => (v==null||v==='') ? 'NULL' : (str?`'${v.toString().replace(/'/g,"''")}'`:v);
  // derive
  const tableTag     = `${payloadName}_CH${ch.nr||ch['node id']||0}`;
  const Datum        = new Date(ch.dateIso||ch.date).toISOString().slice(0,19).replace('T',' ');
  const ID_Code      = ch['id code'];
  const Program_Nr   = ch['prg nr'];
  const Program_Name = ch['prg name'];
  const Zyklus       = ch.cycle;
  const Schraubkanal = ch.nr||ch['node id']||null;
  const Ergebnis     = (ch.result||ch['quality code']||'').toString().trim().toUpperCase();
  // last step
  const steps  = Array.isArray(ch['tightening steps'])?ch['tightening steps']:[];
  const last   = steps[steps.length-1]||{};
  const N_Letz  = last.row||null;
  const P_Letz  = last.name||null;
  // torque/angle
  let Drehmoment_Nom=null, Drehmoment_Ist=null;
  const funcs = Array.isArray(last['tightening functions'])?last['tightening functions']:[];
  const fTor  = funcs.find(f=>f.name==='TF Torque');
  const fAng  = funcs.find(f=>f.name==='TF Angle');
  const finf  = fTor||fAng;
  if(finf){Drehmoment_Nom=finf.nom;Drehmoment_Ist=finf.act;}
  // graph
  let Winkelwerte=null, Drehmomentwerte=null;
  if(last.graph&&Array.isArray(last.graph['angle values'])){
    Winkelwerte=last.graph['angle values'].join(',');
    Drehmomentwerte=Array.isArray(last.graph['torque values'])?last.graph['torque values'].join(','):null;
  } else if(last.graph_b64){
    const {angleValues,torqueValues}=decodeBase64OrArray(last.graph_b64);
    Winkelwerte=angleValues.join(','); Drehmomentwerte=torqueValues.join(',');
  }
  // sql
  const sql = `INSERT INTO ${TARGET_TABLE} (
    Tabelle,Datum,ID_Code,Program_Nr,Program_Name,
    Schraubkanal,Ergebnis,N_Letzter_Schritt,P_Letzter_Schritt,Zyklus,
    Drehmoment_Nom,Drehmoment_Ist,Winkelwerte,Drehmomentwerte
  ) VALUES (
    ${fmt(tableTag,true)},${fmt(Datum,true)},${fmt(ID_Code,true)},${fmt(Program_Nr)},${fmt(Program_Name,true)},
    ${fmt(Schraubkanal)},${fmt(Ergebnis,true)},${fmt(N_Letz)},${fmt(P_Letz,true)},${fmt(Zyklus)},
    ${fmt(Drehmoment_Nom)},${fmt(Drehmoment_Ist)},${fmt(Winkelwerte,true)},${fmt(Drehmomentwerte,true)}
  );`;
  msg.topic = sql;
  return msg;
}

module.exports = processPayload;
// CLI
if(require.main===module){
  const fs   = require('fs'), path=require('path');
  const p    = path.resolve(__dirname,'-MFV3_Halle204_Rest_CH.json');
  const msg  = {payload: JSON.parse(fs.readFileSync(p,'utf8'))};
  console.log(processPayload(msg).topic);
}
