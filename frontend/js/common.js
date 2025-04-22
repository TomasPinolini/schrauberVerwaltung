// Hilfsfunktionen für Datumsformatierung
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function parseGermanDate(dateStr) {
    if (!dateStr) return '';
    // Unterstützt sowohl - als auch / als Trennzeichen
    const parts = dateStr.split(/[-/]/);
    if (parts.length !== 3) return '';
    
    // Konvertiere zu zweistelligen Zahlen
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    
    return `${year}-${month}-${day}`;
}

// Datentyp Validierung
export function validateDataType(value, dataType) {
    switch(dataType) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return !isNaN(value) && typeof Number(value) === 'number';
        case 'date':
            // Prüft ob das Datum im Format DD/MM/YYYY ist
            return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/.test(value);
        case 'boolean':
            return value === 'ja' || value === 'nein';
        default:
            return true;
    }
}

// IP-Adresse validieren
export function isValidIPv4(ip) {
    const pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!pattern.test(ip)) {
        showError('Ungültiges IP-Adressformat. Bitte verwenden Sie das Format: xxx.xxx.xxx.xxx');
        return false;
    }
    
    // Prüfe ob es nicht 0.0.0.0 ist
    if (ip === '0.0.0.0') {
        showError('Die IP-Adresse 0.0.0.0 ist nicht erlaubt');
        return false;
    }
    
    // Prüfe auf private IP-Bereiche
    const parts = ip.split('.');
    const firstOctet = parseInt(parts[0]);
    if (!(
        (firstOctet === 192 && parts[1] === '168') || // 192.168.x.x
        (firstOctet === 172 && parseInt(parts[1]) >= 16 && parseInt(parts[1]) <= 31) || // 172.16.x.x - 172.31.x.x
        (firstOctet === 10) // 10.x.x.x
    )) {
        showError('Bitte verwenden Sie eine private IP-Adresse (192.168.x.x, 172.16-31.x.x oder 10.x.x.x)');
        return false;
    }
    
    return true;
}

// Fehlermeldung anzeigen
export function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show floating-alert';
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Fehler:</strong>
            <span class="ms-2">${message}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Erfolgsmeldung anzeigen
export function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show floating-alert';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Datentyp Icons
export function getDataTypeIcon(dataType) {
    switch (dataType) {
        case 'string': return 'type';
        case 'number': return 'hash';
        case 'date': return 'calendar';
        case 'boolean': return 'check-square';
        default: return 'tag';
    }
}

// Datentyp Labels
export function getDataTypeLabel(dataType) {
    switch (dataType) {
        case 'string': return 'Text';
        case 'number': return 'Zahl';
        case 'date': return 'Datum';
        case 'boolean': return 'Ja/Nein';
        default: return dataType;
    }
} 