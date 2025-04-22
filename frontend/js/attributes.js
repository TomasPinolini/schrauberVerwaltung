// Attribute laden
async function loadAttributes() {
    try {
        const response = await fetch('http://localhost:3001/api/attributes', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Attribute');
        }
        
        const attributes = await response.json();
        console.log('Geladene Attribute:', attributes);
        
        // Attribute nach Status filtern
        const activeAttributes = attributes.filter(attr => attr.state === 'on' && !attr.deleted_at);
        const inactiveAttributes = attributes.filter(attr => (attr.state === 'off' || attr.deleted_at));
        
        console.log('Aktive Attribute:', activeAttributes.length);
        console.log('Inaktive/Gelöschte Attribute:', inactiveAttributes.length);
        
        // Attribute in den entsprechenden Tabs anzeigen
        displayAttributes(activeAttributes, 'activeAttributesList');
        displayAttributes(inactiveAttributes, 'inactiveAttributesList');
        
        // Anzahl der Attribute in den Tab-Badges aktualisieren
        document.getElementById('active-tab').innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            Aktive Attribute 
            <span class="badge bg-primary ms-2">${activeAttributes.length}</span>`;
        document.getElementById('inactive-tab').innerHTML = `
            <i class="bi bi-x-circle me-2"></i>
            Inaktive Attribute
            <span class="badge bg-danger ms-2">${inactiveAttributes.length}</span>`;
        
    } catch (error) {
        console.error('Fehler beim Laden der Attribute:', error);
        showError('Fehler beim Laden der Attribute');
    }
}

// Attribute anzeigen
function displayAttributes(attributes, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    attributes.forEach(attr => {
        const isDeleted = attr.deleted_at !== null;
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="card h-100 attribute-card ${attr.state === 'off' || isDeleted ? 'bg-light' : ''}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="state-badge badge ${getStatusBadgeClass(attr)}">
                            ${getStatusText(attr)}
                        </span>
                        ${isDeleted ? `
                            <span class="badge bg-secondary" title="Gelöscht am ${formatDate(attr.deleted_at)}">
                                <i class="bi bi-trash"></i> Gelöscht
                            </span>
                        ` : ''}
                    </div>
                    <h5 class="card-title mb-3">
                        <i class="bi bi-${getDataTypeIcon(attr.data_type)} me-2"></i>
                        ${attr.name}
                    </h5>
                    <p class="card-text text-muted small mb-2">${attr.description || 'Keine Beschreibung'}</p>
                    <div class="mb-2">
                        <span class="badge bg-primary me-2">${getDataTypeLabel(attr.data_type)}</span>
                        ${attr.is_required ? '<span class="badge bg-warning text-dark">Pflichtfeld</span>' : ''}
                    </div>
                    ${attr.validation_pattern ? `
                        <div class="small text-muted mt-2">
                            <i class="bi bi-code-slash me-1"></i>
                            Pattern: ${attr.validation_pattern}
                        </div>
                    ` : ''}
                    <div class="small text-muted mt-2">
                        <i class="bi bi-clock-history me-1"></i>
                        Erstellt: ${formatDate(attr.created_at)}
                        ${attr.updated_at !== attr.created_at ? `<br>Aktualisiert: ${formatDate(attr.updated_at)}` : ''}
                    </div>
                </div>
                ${!isDeleted ? `
                    <div class="card-footer bg-transparent">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" onclick="editAttribute(${attr.id})">
                                <i class="bi bi-pencil me-1"></i>Bearbeiten
                            </button>
                            <button class="btn btn-outline-${attr.state === 'on' ? 'danger' : 'success'} btn-sm" 
                                    onclick="toggleAttributeState(${attr.id}, '${attr.state === 'on' ? 'off' : 'on'}')">
                                <i class="bi bi-${attr.state === 'on' ? 'x-circle' : 'check-circle'} me-1"></i>
                                ${attr.state === 'on' ? 'Deaktivieren' : 'Aktivieren'}
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    // Wenn keine Attribute vorhanden sind, zeige eine Nachricht
    if (attributes.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info m-3">
                    <i class="bi bi-info-circle me-2"></i>
                    Keine ${containerId === 'activeAttributesList' ? 'aktiven' : 'inaktiven'} Attribute gefunden
                </div>
            </div>`;
    }
}

// Hilfsfunktionen für die Anzeige
function getStatusBadgeClass(attr) {
    if (attr.deleted_at) return 'bg-secondary';
    return attr.state === 'on' ? 'bg-success' : 'bg-danger';
}

function getStatusText(attr) {
    if (attr.deleted_at) return 'Gelöscht';
    return attr.state === 'on' ? 'Aktiv' : 'Inaktiv';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Bestehende Hilfsfunktionen beibehalten
function getDataTypeIcon(dataType) {
    const icons = {
        'string': 'font',
        'number': 'calculator',
        'boolean': 'toggle-on',
        'date': 'calendar-date'
    };
    return icons[dataType] || 'question-circle';
}

function getDataTypeLabel(dataType) {
    const labels = {
        'string': 'Text',
        'number': 'Zahl',
        'boolean': 'Ja/Nein',
        'date': 'Datum'
    };
    return labels[dataType] || dataType;
}

// Attribut speichern
async function saveAttribute() {
    const formData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        data_type: document.getElementById('dataType').value,
        validation_pattern: document.getElementById('validationPattern').value,
        is_required: document.getElementById('isRequired').checked,
        state: 'on'
    };

    try {
        const response = await fetch('http://localhost:3001/api/attributes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Speichern');
        }

        await loadAttributes();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAttributeModal'));
        modal.hide();
        document.getElementById('attributeForm').reset();
        showSuccess('Attribut erfolgreich gespeichert');
    } catch (error) {
        console.error('Fehler:', error);
        showError(`Fehler beim Speichern: ${error.message}`);
    }
}

// Status ändern
async function toggleAttributeState(id, newState) {
    try {
        const response = await fetch(`http://localhost:3001/api/attributes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ state: newState })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Ändern des Status');
        }

        await loadAttributes();
        showSuccess(`Attribut erfolgreich ${newState === 'on' ? 'aktiviert' : 'deaktiviert'}`);
    } catch (error) {
        console.error('Fehler:', error);
        showError(`Fehler beim Ändern des Status: ${error.message}`);
    }
}

// Attribut aktualisieren
async function updateAttribute(id) {
    try {
        const formData = {
            name: document.getElementById('editName').value,
            description: document.getElementById('editDescription').value,
            data_type: document.getElementById('editDataType').value,
            validation_pattern: document.getElementById('editValidationPattern').value,
            is_required: document.getElementById('editIsRequired').checked
        };

        const response = await fetch(`http://localhost:3001/api/attributes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Aktualisieren');
        }

        await loadAttributes();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editAttributeModal'));
        modal.hide();
        showSuccess('Attribut erfolgreich aktualisiert');
    } catch (error) {
        console.error('Fehler:', error);
        showError(`Fehler beim Aktualisieren: ${error.message}`);
    }
}

// Attribut löschen
async function deleteAttribute(id) {
    try {
        const response = await fetch(`http://localhost:3001/api/attributes/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Löschen');
        }

        await loadAttributes();
        showSuccess('Attribut erfolgreich gelöscht');
    } catch (error) {
        console.error('Fehler:', error);
        showError(`Fehler beim Löschen: ${error.message}`);
    }
}

// Initial Attribute laden
document.addEventListener('DOMContentLoaded', loadAttributes); 