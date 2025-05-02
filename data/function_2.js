// =================== function_2: robust test/analysis version ===================
/**
 * Processes a payload like the main function, but:
 * - Sets missing fields explicitly to null
 * - Tracks which fields were missing (for analysis)
 * - Returns both the SQL and a report of missing/nullable fields
 *
 * Usage: const result = function_2(payload);
 *        result.sql  // the SQL string
 *        result.analysis // array of missing/nullable fields per channel
 */
function function_2(payload) {
    const TARGET_TABLE = "dbo.Auftraege";

    const isoDatetime = v => v ? new Date(v).toISOString().slice(0,19).replace('T',' ') : null;
    const fmt = (v, str=false) => (v===undefined || v===null || v==='') ? 'NULL' : str ? `'${v.toString().replace(/'/g,"''")}'` : v;

    // Flexible field getter: tries all keys, case-insensitive, strips whitespace
    function getField(objs, keys, fallback = null, ignoreCase = true) {
        if (!Array.isArray(objs)) objs = [objs];
        for (const obj of objs) {
            if (!obj) continue;
            for (const k of keys) {
                // Exact match
                if (obj[k] !== undefined) return obj[k];
                // Case-insensitive + whitespace-insensitive match
                if (ignoreCase) {
                    const foundKey = Object.keys(obj).find(
                        key => key.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, '')
                    );
                    if (foundKey && obj[foundKey] !== undefined) return obj[foundKey];
                }
            }
        }
        return fallback;
    }

    // Always treat as array of channels, even if single object
    const root = Array.isArray(payload) ? payload[0] : payload;
    const channels = root.channels?.length ? root.channels : [root];
    const baseName = getField(root, ["Table","table","name","appl name","tablename","tabelle"] , 'Unknown');
    const idCode   = getField(root, ["id code","id_code","id code channel","idcode"]);
    const progNr   = getField(root, ["appl nr","prg nr","program nr","applnr","prgnr"]);
    const progName = getField(root, ["appl name","prg name","program name","applname","prgname"]);
    const datum    = isoDatetime(getField(root, ["date","dateIso","prg date","datum","datetime"]));
    const ergebnis = (getField(root, ["result","quality code","ergebnis","oknok"] , '') || '').toString().toUpperCase();

    let material = null, serialnr = null;
    if (idCode?.includes('-') && idCode.includes('_')){
        const [mat,ser] = idCode.split('_')[0].split('-');
        material = mat; serialnr = ser;
    }

    const tuples = [];
    const analysis = [];

    // Add helper function to decode base64 graph data
    function decodeGraphB64(graph) {
        const angleBuf = Buffer.from(graph["angle values"], 'base64');
        const torqueBuf = Buffer.from(graph["torque values"], 'base64');
        const angleValues = [];
        for (let i = 0; i < angleBuf.length; i += 4) {
            angleValues.push(angleBuf.readInt32LE(i) / graph["angle scale"]);
        }
        const torqueValues = [];
        for (let i = 0; i < torqueBuf.length; i += 4) {
            torqueValues.push(torqueBuf.readInt32LE(i) / graph["torque scale"]);
        }
        return { angleValues, torqueValues };
    }

    channels.forEach((ch, idx) => {
        const tableTag = channels.length === 1
            ? (baseName || ch.Table || ch["table"] || ch["appl name"] || 'Unknown')
            : `${baseName}_CH${ch.nr || ch["node id"] || 0}`;
        const steps = ch["tightening steps"] || root["tightening steps"] || [];
        const last = Array.isArray(steps) && steps.length ? steps[steps.length-1] : {};

        // Collect missing fields for analysis
        const missing = [];
        function checkMissing(val, label) { if (val===undefined || val===null || val==="") missing.push(label); }

        const r = {
            Table              : tableTag,
            Datum              : isoDatetime(getField([ch, root], ["date","dateIso","prg date","datum","datetime"])),
            ID_Code            : getField([ch, root], ["id code","id_code","id code channel","idcode"]),
            Program_Nr         : getField([ch, root], ["appl nr","prg nr","program nr","applnr","prgnr"]),
            Program_Name       : getField([ch, root], ["appl name","prg name","program name","applname","prgname"]),
            Materialnummer     : material,
            Serialnummer       : serialnr,
            Schraubkanal       : ch.nr || ch["node id"] || null,
            Ergebnis           : (getField([ch, root], ["result","quality code","ergebnis","oknok"] , ergebnis) || '').toString().toUpperCase(),
            N_Letzter_Schritt  : last.row  ?? null,
            P_Letzter_Schritt  : last.name ?? null,
            Zyklus             : getField([ch, root], ["cycle"]),
            SST                : getField(ch, ["SST","sst"]),
            Drehmoment_Nom     : null, Drehmoment_Ist: null,
            Drehmoment_Min     : null, Drehmoment_Max: null,
            Winkel_Nom         : null, Winkel_Ist   : null,
            Winkel_Min         : null, Winkel_Max   : null,
            Winkelwerte        : null, Drehmomentwerte: null
        };
        // Track missing fields
        for (const [k, label] of [
            [r.Table, "Table"], [r.Datum, "Datum"], [r.ID_Code, "ID_Code"], [r.Program_Nr, "Program_Nr"],
            [r.Program_Name, "Program_Name"], [r.Materialnummer, "Materialnummer"], [r.Serialnummer, "Serialnummer"],
            [r.Schraubkanal, "Schraubkanal"], [r.Ergebnis, "Ergebnis"], [r.N_Letzter_Schritt, "N_Letzter_Schritt"],
            [r.P_Letzter_Schritt, "P_Letzter_Schritt"], [r.Zyklus, "Zyklus"], [r.SST, "SST"]
        ]) checkMissing(k, label);

        // Extract torque and angle from all tightening functions across steps
        const allFns = steps.flatMap(st => st["tightening functions"]||[]);
        allFns.forEach(fn=>{
            const name = fn.name.trim();
            switch(name){
                case 'TF Torque':
                    r.Drehmoment_Nom = fn.nom;
                    r.Drehmoment_Ist = fn.act;
                    break;
                case 'MF TorqueMin':
                    r.Drehmoment_Min = fn.nom;
                    break;
                case 'MF TorqueMax': case 'MFs TorqueMax':
                    r.Drehmoment_Max = fn.nom;
                    break;
                case 'TF Angle':
                    r.Winkel_Nom = fn.nom;
                    r.Winkel_Ist = fn.act;
                    break;
                case 'MF AngleMin':
                    r.Winkel_Min = fn.nom;
                    break;
                case 'MF AngleMax': case 'MFs AngleMax':
                    r.Winkel_Max = fn.nom;
                    break;
            }
            if (fn.add?.[0]?.["angle threshold"]){
                const th = fn.add[0]["angle threshold"];
                r.Winkel_Nom = th.nom ?? r.Winkel_Nom;
                r.Winkel_Ist = th.act ?? r.Winkel_Ist;
            }
        });
        // Graph data extraction (supports both base64 and array)
        let graphData = ch.graph_b64 || last.graph_b64 || root.graph_b64;
        let graphArr  = ch.graph     || last.graph     || root.graph;
        if (graphData) {
            const { angleValues, torqueValues } = decodeGraphB64(graphData);
            r.Winkelwerte     = angleValues.join(',');
            r.Drehmomentwerte = torqueValues.join(',');
        } else if (graphArr) {
            r.Winkelwerte     = Array.isArray(graphArr["angle values"]) ? graphArr["angle values"].join(',') : null;
            r.Drehmomentwerte = Array.isArray(graphArr["torque values"]) ? graphArr["torque values"].join(',') : null;
        }
        // Track missing graph/step fields
        checkMissing(r.N_Letzter_Schritt, "N_Letzter_Schritt");
        checkMissing(r.P_Letzter_Schritt, "P_Letzter_Schritt");
        checkMissing(r.Drehmoment_Nom, "Drehmoment_Nom");
        checkMissing(r.Drehmoment_Ist, "Drehmoment_Ist");
        checkMissing(r.Drehmoment_Min, "Drehmoment_Min");
        checkMissing(r.Drehmoment_Max, "Drehmoment_Max");
        checkMissing(r.Winkel_Nom, "Winkel_Nom");
        checkMissing(r.Winkel_Ist, "Winkel_Ist");
        checkMissing(r.Winkel_Min, "Winkel_Min");
        checkMissing(r.Winkel_Max, "Winkel_Max");
        checkMissing(r.Winkelwerte, "Winkelwerte");
        checkMissing(r.Drehmomentwerte, "Drehmomentwerte");

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
            ${fmt(r.Zyklus)},
            ${fmt(r.SST,true)},
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
        analysis.push({channel: idx, missing});
    });
    const sql = `INSERT INTO ${TARGET_TABLE} (
        Tabelle, Datum, ID_Code, Program_Nr, Program_Name,
        Materialnummer, Serialnummer, Schraubkanal, Ergebnis,
        N_Letzter_Schritt, P_Letzter_Schritt, Zyklus, SST,
        Drehmoment_Nom, Drehmoment_Ist, Drehmoment_Min, Drehmoment_Max,
        Winkel_Nom, Winkel_Ist, Winkel_Min, Winkel_Max,
        Winkelwerte, Drehmomentwerte
    )\nVALUES\n${tuples.join(', ')};`;
    return { sql, analysis };
}
module.exports = { function_2 };
