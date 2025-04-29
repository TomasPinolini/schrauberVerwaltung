// test.js: Test extraction logic for all payloads in one_payload and print the extracted SQL data row
const fs = require('fs');
const path = require('path');

// --- Extraction Logic ---
function decodeBase64OrArray(val) {
    if (typeof val === 'string') {
        // decode base64 to array of numbers (float32 or float64, try both)
        try {
            const buf = Buffer.from(val, 'base64');
            // Try Float32
            if (buf.length % 4 === 0) {
                const arr = [];
                for (let i = 0; i < buf.length; i += 4) {
                    arr.push(buf.readFloatLE(i));
                }
                return arr;
            }
        } catch (e) { /* ignore */ }
        return val; // fallback: raw string
    }
    return val; // already array
}

function extractSqlRow(payload) {
    // Support both channel and application formats
    let top = payload;
    let channel = payload;
    if (payload.format === 'application' && Array.isArray(payload.channels) && payload.channels.length > 0) {
        channel = payload.channels[0]; // Only first channel for test
        top = payload;
    }
    // Find last tightening step
    let steps = channel['tightening steps'] || [];
    if (!Array.isArray(steps) || steps.length === 0) return null;
    const lastStep = steps[steps.length - 1];
    // Helper to get tightening function by name
    const getFn = (name) => (lastStep['tightening functions'] || []).find(f => f.name === name);
    // Helper: get value or null
    const safe = (obj, key) => (obj && obj[key] !== undefined ? obj[key] : null);
    // Graph data
    let angleVals = null, torqueVals = null;
    if (lastStep.graph) {
        angleVals = lastStep.graph['angle values'];
        torqueVals = lastStep.graph['torque values'];
    } else if (lastStep.graph_b64) {
        angleVals = decodeBase64OrArray(lastStep.graph_b64['angle values']);
        torqueVals = decodeBase64OrArray(lastStep.graph_b64['torque values']);
    }
    return {
        Datum: safe(top, 'date') || safe(channel, 'date'),
        ID_Code: safe(top, 'id code') || safe(channel, 'id code'),
        Program_Nr: safe(top, 'prg nr') || safe(channel, 'prg nr') || safe(top, 'appl nr'),
        Program_Name: safe(top, 'prg name') || safe(channel, 'prg name') || safe(top, 'appl name'),
        Materialnummer: null, // Not present
        Serialnummer: safe(channel, 'tool serial'),
        Schraubkanal: safe(channel, 'channel'),
        Ergebnis: safe(channel, 'result') || safe(top, 'result'),
        N_Letzter_Schritt: safe(channel, 'last step row'),
        P_Letzter_Schritt: safe(channel, 'last step column'),
        Drehmoment_Nom: safe(getFn('TF Torque'), 'nom'),
        Drehmoment_Ist: safe(getFn('TF Torque'), 'act'),
        Drehmoment_Min: safe(getFn('MF TorqueMin'), 'nom'),
        Drehmoment_Max: safe(getFn('MF TorqueMax'), 'nom'),
        Winkel_Nom: safe(getFn('TF Angle'), 'nom') || safe(getFn('MF AngleMin'), 'nom'),
        Winkel_Ist: safe(getFn('TF Angle'), 'act') || safe(getFn('MF AngleMin'), 'act'),
        Winkel_Min: safe(getFn('MF AngleMin'), 'nom'),
        Winkel_Max: safe(getFn('MF AngleMax'), 'nom') || safe(getFn('MFs AngleMax'), 'nom'),
        Winkelwerte: angleVals,
        Drehmomentwerte: torqueVals,
    };
}

// --- Test Harness ---
const payloadDir = path.join(__dirname, 'one_payload');
const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));
console.log('Testing extraction for all payloads in one_payload...\n');
files.forEach(filename => {
    const payload = JSON.parse(fs.readFileSync(path.join(payloadDir, filename), 'utf-8'));
    const row = extractSqlRow(payload);
    console.log('--- ' + filename + ' ---');
    console.log(row);
    console.log();
});