// NODE-RED FUNCTION NODE VERSION
// Input: msg.payload contains the JSON data from the MFV3 controller
// Output: msg.topic contains the SQL INSERT statement

// Helper function to decode base64 graph data
function decodeBase64OrArray(val, scale = 1) {
  if (typeof val === 'string') {
    try {
      const buf = Buffer.from(val, 'base64');
      if (buf.length % 4 === 0) {
        const arr = [];
        for (let i = 0; i < buf.length; i += 4) {
          arr.push(buf.readFloatLE(i) / scale);
        }
        return arr;
      }
    } catch (e) { /* ignore */ }
    return val;
  }
  return val;
}

const TARGET_TABLE = 'dbo.Auftraege';
// payloadName hardcoded for table tag
const payloadName = 'MFV3_Halle204_Rest_CH';

// Get data from msg.payload
const ch = msg.payload;
const fmt = (v,str=false) => (v==null||v==='') ? 'NULL' : (str?`'${v.toString().replace(/'/g,"''")}'`:v);

// derive
// Removed channel suffix from tableTag to prevent truncation in database
const tableTag = payloadName;
const Datum        = new Date(ch.dateIso||ch.date).toISOString().slice(0,19).replace('T',' ');
const ID_Code      = ch['id code'];
const Program_Nr   = ch['prg nr'];
const Program_Name = ch['prg name'];
// Zyklus field removed as requested
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

// graph (array or base64)
let Winkelwerte=null, Drehmomentwerte=null;
if (last.graph && Array.isArray(last.graph['angle values'])) {
  Winkelwerte = last.graph['angle values'].join(',');
  Drehmomentwerte = Array.isArray(last.graph['torque values'])
    ? last.graph['torque values'].join(',') : null;
} else if (last.graph_b64) {
  const g = last.graph_b64;
  Winkelwerte = Array.isArray(g['angle values'])
    ? g['angle values'].join(',')
    : decodeBase64OrArray(g['angle values'], g['angle scale']).join(',');
  Drehmomentwerte = Array.isArray(g['torque values'])
    ? g['torque values'].join(',')
    : decodeBase64OrArray(g['torque values'], g['torque scale']).join(',');
}

// sql - removed Zyklus
msg.topic = `INSERT INTO ${TARGET_TABLE} (
  Tabelle,Datum,ID_Code,Program_Nr,Program_Name,
  Schraubkanal,Ergebnis,N_Letzter_Schritt,P_Letzter_Schritt,
  Drehmoment_Nom,Drehmoment_Ist,Winkelwerte,Drehmomentwerte
) VALUES (
  ${fmt(tableTag,true)},${fmt(Datum,true)},${fmt(ID_Code,true)},${fmt(Program_Nr)},${fmt(Program_Name,true)},
  ${fmt(Schraubkanal)},${fmt(Ergebnis,true)},${fmt(N_Letz)},${fmt(P_Letz,true)},
  ${fmt(Drehmoment_Nom)},${fmt(Drehmoment_Ist)},${fmt(Winkelwerte,true)},${fmt(Drehmomentwerte,true)}
);`;

return msg;
