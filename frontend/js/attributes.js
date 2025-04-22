import { showError, showSuccess, getDataTypeIcon, getDataTypeLabel } from './common.js';

// Attribute laden
async function loadAttributes() {
    try {
        const response = await fetch('http://localhost:3000/api/attributes', {
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
        showError('Fehler beim Laden der Attribute: ' + error.message);
    }
}

// Attribute anzeigen
function displayAttributes(attributes, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (attributes.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info m-3">
                    <i class="bi bi-info-circle me-2"></i>
                    Keine ${containerId === 'activeAttributesList' ? 'aktiven' : 'inaktiven'} Attribute gefunden
                </div>
            </div>`;
        return;
    }

    attributes.forEach(attr => {
        const isDeleted = attr.deleted_at !== null;
        const tr = document.createElement('tr');
        tr.className = attr.state === 'off' ? 'table-light' : '';
        
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-${getDataTypeIcon(attr.data_type)} me-2"></i>
                    ${attr.name}
                </div>
            </td>
            <td>${attr.description || '<span class="text-muted">-</span>'}</td>
            <td>
                <span class="badge bg-primary">
                    ${getDataTypeLabel(attr.data_type)}
                </span>
            </td>
            <td>
                ${attr.is_required ? 
                    '<span class="badge bg-warning text-dark">Pflichtfeld</span>' : 
                    '<span class="text-muted">-</span>'}
            </td>
            <td>
                ${attr.validation_pattern ? 
                    `<code class="small">${attr.validation_pattern}</code>` : 
                    '<span class="text-muted">-</span>'}
            </td>
            <td>
                <span class="badge ${attr.state === 'on' ? 'bg-success' : 'bg-danger'}">
                    ${attr.state === 'on' ? 'Aktiv' : 'Inaktiv'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editAttribute(${attr.id})" title="Bearbeiten">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-${attr.state === 'on' ? 'danger' : 'success'}" 
                            onclick="toggleAttributeState(${attr.id}, '${attr.state === 'on' ? 'off' : 'on'}')"
                            title="${attr.state === 'on' ? 'Deaktivieren' : 'Aktivieren'}">
                        <i class="bi bi-${attr.state === 'on' ? 'x-circle' : 'check-circle'}"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
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
async function saveAttribute(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('attributeName').value,
        description: document.getElementById('attributeDescription').value,
        data_type: document.getElementById('attributeDataType').value,
        validation_pattern: document.getElementById('attributeValidationPattern').value,
        is_required: document.getElementById('attributeIsRequired').checked,
        state: 'on'
    };

    try {
        const response = await fetch('http://localhost:3000/api/attributes', {
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('createAttributeModal'));
        modal.hide();
        document.getElementById('createAttributeForm').reset();
        showSuccess('Attribut erfolgreich gespeichert');
    } catch (error) {
        console.error('Fehler:', error);
        showError(`Fehler beim Speichern: ${error.message}`);
    }
}

// Status ändern
async function toggleAttributeState(id, newState) {
    try {
        const response = await fetch(`http://localhost:3000/api/attributes/${id}`, {
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
async function updateAttribute(event) {
    event.preventDefault();
    
    const id = document.getElementById('editAttributeId').value;
    const formData = {
        name: document.getElementById('editAttributeName').value,
        description: document.getElementById('editAttributeDescription').value,
        data_type: document.getElementById('editAttributeDataType').value,
        validation_pattern: document.getElementById('editAttributeValidationPattern').value,
        is_required: document.getElementById('editAttributeRequired').checked
    };

    try {
        const response = await fetch(`http://localhost:3000/api/attributes/${id}`, {
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
        const response = await fetch(`http://localhost:3000/api/attributes/${id}`, {
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
document.addEventListener('DOMContentLoaded', () => {
    loadAttributes();
    
    // Add form submit handlers
    document.getElementById('createAttributeForm').addEventListener('submit', saveAttribute);
    document.getElementById('editAttributeForm').addEventListener('submit', updateAttribute);
    
    // Add filter handler
    document.getElementById('attributeFilter').addEventListener('change', async (e) => {
        const filter = e.target.value;
        const response = await fetch('http://localhost:3000/api/attributes');
        const attributes = await response.json();
        
        let filteredAttributes;
        switch(filter) {
            case 'active':
                filteredAttributes = attributes.filter(attr => attr.state === 'on');
                break;
            case 'inactive':
                filteredAttributes = attributes.filter(attr => attr.state === 'off');
                break;
            default:
                filteredAttributes = attributes;
        }
        
        displayAttributes(filteredAttributes);
    });
    
    // Add search handler
    document.getElementById('searchInput').addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const response = await fetch('http://localhost:3000/api/attributes');
        const attributes = await response.json();
        
        const filteredAttributes = attributes.filter(attr => 
            attr.name.toLowerCase().includes(searchTerm) ||
            (attr.description && attr.description.toLowerCase().includes(searchTerm))
        );
        
        displayAttributes(filteredAttributes);
    });
});

// Make functions available globally
window.editAttribute = editAttribute;
window.toggleAttributeState = toggleAttributeState; 