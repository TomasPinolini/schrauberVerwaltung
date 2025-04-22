// Pflichtattribute laden
async function loadRequiredAttributes() {
    try {
        const response = await fetch('http://localhost:3001/api/attributes');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Attribute');
        }
        
        const attributes = await response.json();
        const container = document.getElementById('requiredAttributesContainer');
        
        // Nur aktive Pflichtattribute filtern
        const requiredAttributes = attributes.filter(attr => 
            attr.is_required && 
            attr.state === 'on' && 
            !attr.deleted_at
        );
        
        if (requiredAttributes.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        Keine Pflichtattribute gefunden
                    </div>
                </div>`;
            return;
        }
        
        // Attribute als Formularfelder anzeigen
        container.innerHTML = requiredAttributes.map(attr => `
            <div class="col-md-6">
                <div class="form-group">
                    <label for="attr_${attr.id}" class="form-label">
                        ${attr.name}*
                        ${attr.description ? `
                            <i class="bi bi-info-circle ms-1" 
                               data-bs-toggle="tooltip" 
                               title="${attr.description}"></i>
                        ` : ''}
                    </label>
                    ${getInputField(attr)}
                </div>
            </div>
        `).join('');
        
        // Tooltips initialisieren
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(el => new bootstrap.Tooltip(el));
        
    } catch (error) {
        console.error('Fehler beim Laden der Attribute:', error);
        document.getElementById('requiredAttributesContainer').innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger mb-0">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    Fehler beim Laden der Pflichtattribute: ${error.message}
                </div>
            </div>`;
    }
}

// Eingabefeld basierend auf Attributtyp generieren
function getInputField(attribute) {
    const commonAttrs = `
        id="attr_${attribute.id}"
        name="attributes[${attribute.id}]"
        data-attribute-id="${attribute.id}"
        data-type="${attribute.data_type}"
        data-pattern="${attribute.validation_pattern}"
        required
    `;
    
    switch (attribute.data_type) {
        case 'date':
            return `
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-calendar"></i>
                    </span>
                    <input type="date" 
                           class="form-control" 
                           ${commonAttrs}>
                    <div class="invalid-feedback">
                        Bitte wählen Sie ein Datum
                    </div>
                </div>`;
            
        case 'number':
            return `
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-hash"></i>
                    </span>
                    <input type="number" 
                           class="form-control" 
                           ${commonAttrs}
                           ${attribute.validation_pattern ? `pattern="${attribute.validation_pattern}"` : ''}>
                    <div class="invalid-feedback">
                        Bitte geben Sie eine gültige Zahl ein
                    </div>
                </div>`;
            
        case 'boolean':
            return `
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-toggle-on"></i>
                    </span>
                    <select class="form-select" ${commonAttrs}>
                        <option value="">Bitte wählen...</option>
                        <option value="true">Ja</option>
                        <option value="false">Nein</option>
                    </select>
                    <div class="invalid-feedback">
                        Bitte wählen Sie einen Wert
                    </div>
                </div>`;
            
        default: // string
            return `
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-font"></i>
                    </span>
                    <input type="text" 
                           class="form-control" 
                           ${commonAttrs}
                           ${attribute.validation_pattern ? `pattern="${attribute.validation_pattern}"` : ''}>
                    <div class="invalid-feedback">
                        Bitte geben Sie einen gültigen Wert ein
                    </div>
                </div>`;
    }
}

// Wert validieren
async function validateValue(value, attribute) {
    if (attribute.is_required && (value === null || value === undefined || value === '')) {
        throw new Error(`${attribute.name} ist erforderlich`);
    }

    if (!value && !attribute.is_required) {
        return true;
    }

    switch (attribute.data_type) {
        case 'string':
            if (attribute.validation_pattern && !new RegExp(attribute.validation_pattern).test(value)) {
                throw new Error(`${attribute.name} entspricht nicht dem erforderlichen Format`);
            }
            break;
        case 'number':
            if (isNaN(value)) {
                throw new Error(`${attribute.name} muss eine Zahl sein`);
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                throw new Error(`${attribute.name} muss ein Boolean-Wert sein`);
            }
            break;
        case 'date':
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error(`${attribute.name} muss ein gültiges Datum sein`);
            }
            if (date.getFullYear() !== 2025) {
                throw new Error(`${attribute.name} muss im Jahr 2025 liegen`);
            }
            break;
        default:
            throw new Error(`Unbekannter Datentyp für ${attribute.name}`);
    }

    return true;
}

// Formular absenden
async function submitScrewdriverForm(e) {
    e.preventDefault();
    
    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        showError('Bitte füllen Sie alle erforderlichen Felder korrekt aus');
        return;
    }

    const formData = {
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        attributes: []
    };

    // Alle Attribute sammeln und validieren
    const attributeInputs = document.querySelectorAll('[name^="attributes["]');
    for (const input of attributeInputs) {
        const attributeId = input.getAttribute('data-attribute-id');
        const dataType = input.getAttribute('data-type');
        const validationPattern = input.getAttribute('data-pattern');
        let value = input.value.trim();

        // Erstelle ein Attributobjekt für die Validierung
        const attribute = {
            id: parseInt(attributeId),
            name: input.closest('.form-group').querySelector('label').textContent.trim().replace('*', ''),
            data_type: dataType,
            validation_pattern: validationPattern,
            is_required: input.hasAttribute('required')
        };

        // Validiere den Wert basierend auf dem Datentyp
        try {
            await validateValue(value, attribute);
        } catch (error) {
            input.classList.add('is-invalid');
            showError(error.message);
            return;
        }

        // Formatiere den Wert entsprechend
        if (dataType === 'date') {
            // Ensure the date is in DD/MM/YYYY format for the API
            value = formatDateForAPI(value);
            
            // Validate the formatted date
            const dateParts = value.split('/');
            if (dateParts.length !== 3 || dateParts[2] !== '2025') {
                input.classList.add('is-invalid');
                showError(`${attribute.name} muss im Jahr 2025 sein und im Format DD/MM/YYYY vorliegen`);
                return;
            }
        } else if (dataType === 'boolean') {
            value = value === 'true';
        } else if (dataType === 'number') {
            value = Number(value);
        }

        formData.attributes.push({
            attributeId: parseInt(attributeId),
            value: value.toString()
        });
    }

    try {
        console.log('Sende Daten:', formData); // Debug-Ausgabe

        const response = await fetch('http://localhost:3000/api/screwdrivers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || 'Ein unerwarteter Fehler ist aufgetreten');
        }

        showSuccess('Schraubendreher erfolgreich gespeichert!');
        e.target.reset();
        e.target.classList.remove('was-validated');
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        await loadScrewdrivers(); // Tabelle aktualisieren
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        const errorMessage = error.message || 'Ein unerwarteter Fehler ist aufgetreten';
        showError(`Fehler beim Speichern: ${errorMessage}`);
    }
}

// Datum für API formatieren
function formatDateForAPI(dateStr) {
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Datum für Anzeige formatieren
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Schraubendreher laden
async function loadScrewdrivers() {
    try {
        // First, get all active attributes to create the table headers
        const attributesResponse = await fetch('http://localhost:3000/api/attributes');
        if (!attributesResponse.ok) {
            throw new Error('Fehler beim Laden der Attribute');
        }
        const allAttributes = await attributesResponse.json();
        const activeAttributes = allAttributes.filter(attr => attr.state === 'on');

        // Then get all screwdrivers
        const response = await fetch('http://localhost:3000/api/screwdrivers');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Schraubendreher');
        }
        
        const screwdrivers = await response.json();
        console.log('Loaded screwdrivers:', screwdrivers); // Debug log

        // Create table header if it doesn't exist
        const tableHeader = document.querySelector('#screwdriversTable thead');
        if (tableHeader) {
            tableHeader.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Beschreibung</th>
                    ${activeAttributes.map(attr => `
                        <th>
                            ${attr.name}
                            ${attr.is_required ? '<span class="text-danger">*</span>' : ''}
                            ${attr.description ? `
                                <i class="bi bi-info-circle ms-1" 
                                   data-bs-toggle="tooltip" 
                                   title="${attr.description}"></i>
                            ` : ''}
                        </th>
                    `).join('')}
                    <th>Erstellt am</th>
                    <th>Status</th>
                    <th>Aktionen</th>
                </tr>
            `;
        }
        
        const tableBody = document.getElementById('screwdriversTableBody');
        
        if (!tableBody) {
            console.error('Table body element not found');
            return;
        }
        
        if (screwdrivers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${6 + activeAttributes.length}" class="text-center py-4">
                        <i class="bi bi-info-circle me-2"></i>
                        Keine Schraubendreher gefunden
                    </td>
                </tr>`;
            return;
        }
        
        tableBody.innerHTML = screwdrivers.map(screwdriver => `
            <tr>
                <td>${screwdriver.id}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-tools me-2"></i>
                        ${screwdriver.name}
                    </div>
                </td>
                <td>${screwdriver.description || '-'}</td>
                ${activeAttributes.map(attr => {
                    const attributeValue = screwdriver.attributes.find(a => a.attribute_id === attr.id)?.value;
                    let displayValue = attributeValue || '-';
                    
                    // Format the value based on attribute type
                    if (attr.data_type === 'date' && attributeValue) {
                        displayValue = formatDateForDisplay(attributeValue);
                    } else if (attr.data_type === 'boolean') {
                        displayValue = attributeValue === 'true' ? 
                            '<i class="bi bi-check-circle text-success"></i>' : 
                            '<i class="bi bi-x-circle text-danger"></i>';
                    }
                    
                    return `
                        <td class="attribute-value" data-attribute-id="${attr.id}" data-type="${attr.data_type}">
                            ${displayValue}
                        </td>
                    `;
                }).join('')}
                <td>${formatDateForDisplay(screwdriver.created_at)}</td>
                <td>
                    <span class="badge ${screwdriver.state === 'on' ? 'bg-success' : 'bg-danger'}">
                        ${screwdriver.state === 'on' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editScrewdriver(${screwdriver.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-${screwdriver.state === 'on' ? 'danger' : 'success'}" 
                                onclick="toggleScrewdriverState(${screwdriver.id}, '${screwdriver.state === 'on' ? 'off' : 'on'}')">
                            <i class="bi bi-${screwdriver.state === 'on' ? 'x-circle' : 'check-circle'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Initialize tooltips
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(el => new bootstrap.Tooltip(el));
        
    } catch (error) {
        console.error('Fehler beim Laden der Schraubendreher:', error);
        const tableBody = document.getElementById('screwdriversTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        Fehler beim Laden der Schraubendreher: ${error.message}
                    </td>
                </tr>`;
        }
    }
}

// Status eines Schraubendrehers ändern
async function toggleScrewdriverState(id, newState) {
    try {
        const response = await fetch(`http://localhost:3000/api/screwdrivers/${id}`, {
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

        await loadScrewdrivers();
        showSuccess(`Schraubendreher erfolgreich ${newState === 'on' ? 'aktiviert' : 'deaktiviert'}`);
    } catch (error) {
        console.error('Fehler:', error);
        showError(`Fehler beim Ändern des Status: ${error.message}`);
    }
}

// Schraubendreher bearbeiten
function editScrewdriver(id) {
    // TODO: Implementiere die Bearbeitung
    console.log('Bearbeite Schraubendreher:', id);
}

// Datum formatieren
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

async function getAttributeValues(screwdriverId) {
    try {
        const response = await fetch(`http://localhost:3000/api/attribute-values/screwdriver/${screwdriverId}/values`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Laden der Attributwerte');
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Laden der Attributwerte:', error);
        throw error;
    }
}

async function updateAttributeValues(screwdriverId, values) {
    try {
        const response = await fetch(`http://localhost:3000/api/attribute-values/screwdriver/${screwdriverId}/values`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Fehler beim Aktualisieren der Attributwerte');
        }

        return await response.json();
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Attributwerte:', error);
        throw error;
    }
}

async function loadScrewdriverDetails(screwdriverId) {
    try {
        const values = await getAttributeValues(screwdriverId);
        displayAttributeValues(values);
    } catch (error) {
        showError(error.message);
    }
}

async function saveScrewdriverDetails(screwdriverId) {
    try {
        const form = document.getElementById('screwdriverForm');
        const inputs = form.querySelectorAll('input, select');
        const values = [];

        for (const input of inputs) {
            const attributeId = input.getAttribute('data-attribute-id');
            if (!attributeId) continue;

            const attribute = attributes.find(a => a.id === parseInt(attributeId));
            if (!attribute) continue;

            let value = input.value;
            if (attribute.data_type === 'boolean') {
                value = input.checked;
            }

            try {
                await validateValue(value, attribute);
                values.push({
                    attribute_id: attributeId,
                    value: value
                });
            } catch (validationError) {
                input.classList.add('is-invalid');
                throw validationError;
            }
        }

        await updateAttributeValues(screwdriverId, values);
        showSuccess('Schraubendreher erfolgreich aktualisiert');
    } catch (error) {
        showError(error.message);
    }
}

function displayAttributeValues(values) {
    const form = document.getElementById('screwdriverForm');
    form.innerHTML = '';

    attributes.forEach(attribute => {
        const value = values.find(v => v.attribute_id === attribute.id)?.value || '';
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group mb-3';

        const label = document.createElement('label');
        label.textContent = attribute.name;
        if (attribute.is_required) {
            const required = document.createElement('span');
            required.className = 'text-danger ms-1';
            required.textContent = '*';
            label.appendChild(required);
        }

        let input;
        switch (attribute.data_type) {
            case 'boolean':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'form-check-input ms-2';
                input.checked = value === true;
                break;
            case 'date':
                input = document.createElement('input');
                input.type = 'date';
                input.className = 'form-control';
                input.min = '2025-01-01';
                input.max = '2025-12-31';
                if (value) {
                    input.value = new Date(value).toISOString().split('T')[0];
                }
                break;
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-control';
                input.value = value;
        }

        input.setAttribute('data-attribute-id', attribute.id);
        if (attribute.validation_pattern) {
            input.pattern = attribute.validation_pattern;
        }

        formGroup.appendChild(label);
        formGroup.appendChild(input);

        if (attribute.description) {
            const helpText = document.createElement('small');
            helpText.className = 'form-text text-muted';
            helpText.textContent = attribute.description;
            formGroup.appendChild(helpText);
        }

        form.appendChild(formGroup);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.className = 'btn btn-primary';
    submitButton.textContent = 'Speichern';
    submitButton.onclick = () => saveScrewdriverDetails(currentScrewdriverId);
    form.appendChild(submitButton);
} 