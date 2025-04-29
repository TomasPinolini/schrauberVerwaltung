/* ====================================================================
   Function node: Build INSERT for dbo.Auftraege
   • Column 1  = [Table]  (screwdriver tag, per channel)
   • Handles single- and multi-channel payloads in ONE insert
   • EXTENDED: Robust normalization for all known payload formats
   ==================================================================== */

const TARGET_TABLE = "dbo.Auftraege";      // schema-qualified table name
const TABLE_COL    = "[Table]";            // bracketed (reserved word)

// ---------- helpers -------------------------------------------------- */
const base64ToArr = (b64, scale = 1) =>
    !b64 ? [] :
    Array.from(new Uint16Array(Buffer.from(b64,'base64').buffer))
         .map(v => v/scale);

const isoDatetime = v => v ? new Date(v).toISOString().slice(0,19).replace('T',' ') : null;

const fmt = (v, str=false) =>
      (v===undefined || v===null || v==='') ? 'NULL'
      : str ? `'${v.toString().replace(/'/g,"''")}'` : v;

// ---------- normalize input ----------------------------------------- */
// Always treat as array of channels, even if single object
const root = Array.isArray(msg.payload) ? msg.payload[0] : msg.payload;
const channels = root.channels?.length ? root.channels : [root];

const baseName = root.Table || root["table"] || root["name"] || root["appl name"] || 'Unknown';
const idCode   = root["id code"] || root["id_code"] || root["id code channel"] || null;
const progNr   = root["appl nr"] || root["prg nr"] || root["program nr"] || null;
const progName = root["appl name"] || root["prg name"] || root["program name"] || null;
const datum    = isoDatetime(root.date || root.dateIso || root["prg date"]);
const ergebnis = (root.result || root["quality code"] || '').toString().toUpperCase();

// Material & serial split from "MAT-SER_…" (if present)
let material = null, serialnr = null;
if (idCode?.includes('-') && idCode.includes('_')){
    const [mat,ser] = idCode.split('_')[0].split('-');
    material = mat; serialnr = ser;
}

const tuples = [];

channels.forEach(ch => {
    // channel-specific tag e.g.  GH4_LinkesBand_CH2
    const tableTag = channels.length === 1
        ? (baseName || ch.Table || ch["table"] || ch["appl name"] || 'Unknown')
        : `${baseName}_CH${ch.nr || ch["node id"] || 0}`;

    // Prefer channel-level fields, fallback to root
    const steps = ch["tightening steps"] || root["tightening steps"] || [];
    if (!Array.isArray(steps) || !steps.length) return;
    const last = steps[steps.length-1] || {};

    const r = {
        Table              : tableTag,
        Datum              : isoDatetime(ch.date || ch.dateIso || root.date || root.dateIso || ch["prg date"]),
        ID_Code            : ch["id code"] || ch["id_code"] || ch["id code channel"] || idCode,
        Program_Nr         : ch["appl nr"] || ch["prg nr"] || ch["program nr"] || progNr,
        Program_Name       : ch["appl name"] || ch["prg name"] || ch["program name"] || progName,
        Materialnummer     : material,
        Serialnummer       : serialnr,
        Schraubkanal       : ch.nr || ch["node id"] || null,
        Ergebnis           : (ch.result || ch["quality code"] || ergebnis || '').toString().toUpperCase(),
        N_Letzter_Schritt  : last.row  ?? null,
        P_Letzter_Schritt  : last.name ?? null,
        Drehmoment_Nom     : null, Drehmoment_Ist: null,
        Drehmoment_Min     : null, Drehmoment_Max: null,
        Winkel_Nom         : null, Winkel_Ist   : null,
        Winkel_Min         : null, Winkel_Max   : null,
        Winkelwerte        : null, Drehmomentwerte: null
    };

    // Extract tightening function values if present
    (last["tightening functions"]||[]).forEach(fn=>{
        switch(fn.name){
            case 'TF Torque':     r.Drehmoment_Nom = fn.nom; r.Drehmoment_Ist = fn.act; break;
            case 'MF TorqueMin':  r.Drehmoment_Min = fn.nom; break;
            case 'MF TorqueMax':  // Some payloads use MF TorqueMax instead of MFs TorqueMax
            case 'MFs TorqueMax': r.Drehmoment_Max = fn.nom; break;
            case 'TF Angle':      r.Winkel_Nom     = fn.nom; r.Winkel_Ist     = fn.act; break;
            case 'MF AngleMin':   r.Winkel_Min     = fn.nom; break;
            case 'MF AngleMax':
            case 'MFs AngleMax':  r.Winkel_Max     = fn.nom; break;
        }
        if (fn.add?.[0]?.["angle threshold"]){
            const th = fn.add[0]["angle threshold"];
            r.Winkel_Nom = th.nom ?? r.Winkel_Nom;
            r.Winkel_Ist = th.act ?? r.Winkel_Ist;
        }
    });

    // Graph data extraction (supports both b64 and array)
    // 1. Prefer channel-level, then last step, then root
    let graphData = ch.graph_b64 || last.graph_b64 || root.graph_b64 || null;
    let graphArr  = ch.graph     || last.graph     || root.graph     || null;
    // If NOK, try to extract graph data
    if (r.Ergebnis === 'NOK' || graphData || graphArr) {
        if (graphData) {
            r.Winkelwerte     = base64ToArr(graphData["angle values"],  graphData["angle scale"] ||1).join(',');
            r.Drehmomentwerte = base64ToArr(graphData["torque values"], graphData["torque scale"]||1).join(',');
        } else if (graphArr) {
            // graph as arrays
            r.Winkelwerte     = Array.isArray(graphArr["angle values"]) ? graphArr["angle values"].join(',') : null;
            r.Drehmomentwerte = Array.isArray(graphArr["torque values"]) ? graphArr["torque values"].join(',') : null;
        }
    }

    tuples.push(`(
        ${fmt(r.Table,true)},
        ${fmt(r.Datum,true)},
        ${fmt(r.ID_Code,true)},
        ${fmt(r.Program_Nr)},
        ${fmt(r.Program_Name,true)},
        ${fmt(r.Materialnummer,true)},
        ${fmt(r.Serialnummer,true)},
        ${fmt(r.Schraubkanal)},
        ${fmt(r.Ergebnis,true)},
        ${fmt(r.N_Letzter_Schritt)},
        ${fmt(r.P_Letzter_Schritt,true)},
        ${fmt(r.Drehmoment_Nom)},
        ${fmt(r.Drehmoment_Ist)},
        ${fmt(r.Drehmoment_Min)},
        ${fmt(r.Drehmoment_Max)},
        ${fmt(r.Winkel_Nom)},
        ${fmt(r.Winkel_Ist)},
        ${fmt(r.Winkel_Min)},
        ${fmt(r.Winkel_Max)},
        ${fmt(r.Winkelwerte,true)},
        ${fmt(r.Drehmomentwerte,true)}
    )`);
});

// ---------- final SQL sent to MSSQL node ---------------------------- */
msg.topic = `
INSERT INTO ${TARGET_TABLE} (
    ${TABLE_COL},
    Datum, ID_Code, Program_Nr, Program_Name,
    Materialnummer, Serialnummer, Schraubkanal, Ergebnis,
    N_Letzter_Schritt, P_Letzter_Schritt,
    Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max,
    Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
    Winkelwerte, Drehmomentwerte
)
VALUES
${tuples.join(',\n')};`;

return msg;
