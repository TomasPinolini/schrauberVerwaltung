/*  INPUT   msg.payload  :  Objekt oder Array von Objekten (JSON-Payload)
    OUTPUT  mehrere Nachrichten (node.send) – jeweils:
            msg.params  :  für UpsertAllLookups
            msg.insert  :  für InsertVerschraubungPackage
            msg.filename:  originaler Dateiname (für Fehler-Handling)
*/

/* ---------- Hilfsfunktionen ---------- */
function base64ToArr(b64, scale = 1) {
    if (!b64) return [];
    const bin = Buffer.from(b64, 'base64');
    const u16 = new Uint16Array(bin.buffer, bin.byteOffset, bin.byteLength / 2);
    return Array.from(u16).map(v => v / scale);
}

/* ---------- Payload normalisieren ---------- */
const rows = Array.isArray(msg.payload) ? msg.payload : [msg.payload];

/* ---------- Datei enthält i. d. R. nur einen „row“ -------- */
const row      = rows[0];
const channels = row.channels && row.channels.length ? row.channels : [row];

/* ---------- Ober­gemeinsame Infos ---------- */
const idCode   = row["id code"]     || null;
const progNr   = row["appl nr"]     || row["prg nr"]  || null;
const progName = row["appl name"]   || row["prg name"]|| null;
const progDate = row["prg date"]    || null;
const datum    = row.date || row.dateIso || null;
const swVersionRoot = row["sw version"] || null;
const swVersionChan = ch["sw version"]  || swVersionRoot;
const resultTxt= (row.result || '').toUpperCase();      // OK / NOK

/* Material + Serien­nummer nur wenn „MAT-SER_…“ */
let material = null, serialnr = null;
if (idCode && idCode.includes('-') && idCode.includes('_')) {
    const dash = idCode.split('_')[0].split('-');        // "MAT-SER"
    if (dash.length === 2) { material = dash[0]; serialnr = dash[1]; }
}

/* ---------- pro Kanal eine Nachricht ---------- */
channels.forEach(ch => {

    /* Ist- und Graph-Arrays kanal­spezifisch bauen */
    const istArr   = [];
    const graphArr = [];
    (ch["tightening steps"] || []).forEach(step => {

        /* Ist-Werte */
        (step["tightening functions"] || []).forEach(fn => {
            istArr.push({ id_Messung: fn.name, wert: fn.act });
        });

        /* Graph nur bei NOK */
        if (resultTxt === 'NOK' && step.graph_b64) {
            const g = step.graph_b64;
            graphArr.push({
                id_Messung: step.name,
                werte: JSON.stringify({
                    angle : base64ToArr(g["angle values"],  g["angle scale"]  || 1),
                    torque: base64ToArr(g["torque values"], g["torque scale"] || 1)
                })
            });
        }
    });

    /* ---------- Upsert-Parameter ---------- */
    const params = {
        mt:               material ?? 'UNDEF',

        /* Schrauber – kanal­spezifische Serien-Nr. */
        tool_serial:      ch["tool serial"] || row["tool serial"],
        id_Code:          idCode,
        sch_name:         ch.hardware || row.hardware,
        ip0:              ch.ip0      || row.ip0,
        mac0:             ch.mac0     || row.mac0,
        hardware:         ch.hardware || row.hardware,

        /* Programm + Version (vom Top-Level) */
        programm_nr:      progNr,
        programm_name:    progName,
        seit_datum:       progDate ? progDate.substring(0,10) : null,
        prog_date:        progDate,

        /* Platzhalter für OUTPUT-IDs */
        id_material:         null,
        id_schrauber:        null,
        id_programm:         null,
        id_programm_version: null
    };

    /* ---------- Insert-Parameter ---------- */
    const insert = {
        datum:         datum,
        id_Code:       idCode,
        ergebnis:      resultTxt === 'OK' ? 'O' : 'N',
        serialnummer:  serialnr,
        channel:       channels.length > 1
                         ? (ch.nr || ch["node id"] || '')
                         : '',
        gesamt_zeit:   parseFloat(row["total time"]) || null,

        json_Istwerte: JSON.stringify(istArr),
        json_Graph:    JSON.stringify(graphArr)
    };

    /* ---------- Nachricht erzeugen ---------- */
    node.send({
        filename: msg.filename,   // für Error-Flow
        params:   params,
        insert:   insert
    });
});

/* nichts zurückgeben, da node.send schon alles ausgegeben hat */
return null;
