// Pflichtattribute laden
async function loadRequiredAttributes() {
    try {
        const response = await fetch('http://localhost:3000/api/attributes');
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
        id="${attribute.id || `attr_${attribute.id}`}"
        name="attributes[${attribute.id}]"
        data-attribute-id="${attribute.id}"
        data-type="${attribute.data_type}"
        ${attribute.validation_pattern ? `pattern="${attribute.validation_pattern}"` : ''}
        ${attribute.is_required ? 'required' : ''}
    `;
    
    switch (attribute.data_type) {
        case 'date':
            let dateValue = '';
            if (attribute.value) {
                const [day, month, year] = attribute.value.split('/');
                dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            
            return `
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="bi bi-calendar"></i>
                    </span>
                    <input type="date" 
                           class="form-control" 
                           min="1995-01-01"
                           max="2050-12-31"
                           placeholder="TT/MM/JJJJ"
                           ${commonAttrs}
                           value="${dateValue}">
                    <div class="invalid-feedback">
                        Bitte wählen Sie ein Datum zwischen 1995 und 2050
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
                           ${commonAttrs}>
                    <div class="invalid-feedback">
                        ${attribute.validation_pattern ? 
                          'Bitte geben Sie eine gültige Zahl gemäß dem vorgegebenen Format ein' : 
                          'Bitte geben Sie eine gültige Zahl ein'}
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
                        <option value="true" ${attribute.value === 'true' ? 'selected' : ''}>Ja</option>
                        <option value="false" ${attribute.value === 'false' ? 'selected' : ''}>Nein</option>
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
                           ${commonAttrs}>
                    <div class="invalid-feedback">
                        ${attribute.validation_pattern ? 
                          `Bitte geben Sie einen gültigen Wert ein (Format: ${attribute.validation_pattern})` : 
                          'Bitte geben Sie einen gültigen Wert ein'}
                    </div>
                </div>`;
    }
}

// Wert validieren
async function validateValue(value, attribute) {
    // Check if required
    if (attribute.is_required && (value === null || value === undefined || value === '')) {
        throw new Error(`${attribute.name} ist erforderlich`);
    }

    // If not required and empty, it's valid
    if (!value && !attribute.is_required) {
        return true;
    }

    // Check validation pattern if exists
    if (attribute.validation_pattern && value) {
        const regex = new RegExp(attribute.validation_pattern);
        if (!regex.test(value.toString())) {
            throw new Error(`${attribute.name} entspricht nicht dem erforderlichen Format (${attribute.validation_pattern})`);
        }
    }

    // Type-specific validation
    switch (attribute.data_type) {
        case 'string':
            // Already checked with validation pattern if exists
            break;
        case 'number':
            if (isNaN(value)) {
                throw new Error(`${attribute.name} muss eine Zahl sein`);
            }
            // Additional number validation if pattern exists was done above
            break;
        case 'boolean':
            if (value !== 'true' && value !== 'false') {
                throw new Error(`${attribute.name} muss Ja oder Nein sein`);
            }
            break;
        case 'date':
            try {
                const [year, month, day] = value.split('-');
                const yearNum = parseInt(year);
                if (yearNum < 1995 || yearNum > 2050) {
                    throw new Error(`${attribute.name} muss zwischen 1995 und 2050 liegen`);
                }
                // Validate date format
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error(`${attribute.name} muss ein gültiges Datum sein`);
            }
            } catch (error) {
                throw new Error(`${attribute.name} muss ein gültiges Datum zwischen 1995 und 2050 sein`);
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
        let value = input.value.trim();

        // Erstelle ein Attributobjekt für die Validierung
        const attribute = {
            id: parseInt(attributeId),
            name: input.closest('.form-group').querySelector('label').textContent.trim().replace('*', ''),
            data_type: dataType,
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
            // Convert YYYY-MM-DD to DD/MM/YYYY
            const [year, month, day] = value.split('-');
            value = `${day}/${month}/${year}`;
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
        const response = await fetch('http://localhost:3000/api/screwdrivers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ein unerwarteter Fehler ist aufgetreten');
        }

        showSuccess('Schraubendreher erfolgreich gespeichert!');
        e.target.reset();
        e.target.classList.remove('was-validated');
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        await loadScrewdrivers();
    } catch (error) {
        showError(`Fehler beim Speichern: ${error.message}`);
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
    return date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(',', '');
}

// Filter state
let currentFilter = 'all';
let currentSearch = '';

// Function to filter screwdrivers
function filterScrewdrivers(screwdrivers) {
    console.log('Filtering screwdrivers:', { currentFilter, currentSearch, totalScrewdrivers: screwdrivers.length });
    
    return screwdrivers.filter(screwdriver => {
        // Apply state filter
        const stateMatch = currentFilter === 'all' || 
                          (currentFilter === 'active' && screwdriver.state === 'on') ||
                          (currentFilter === 'inactive' && screwdriver.state === 'off');

        // Apply search filter
        const searchMatch = !currentSearch || 
                          screwdriver.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
                          screwdriver.description?.toLowerCase().includes(currentSearch.toLowerCase());

        console.log('Screwdriver:', {
            id: screwdriver.id,
            name: screwdriver.name,
            state: screwdriver.state,
            stateMatch,
            searchMatch
        });

        return stateMatch && searchMatch;
    });
}

// Function to update table with filtered data
function updateTableWithFilteredData(screwdrivers) {
    console.log('Updating table with screwdrivers:', screwdrivers);
    const filteredScrewdrivers = filterScrewdrivers(screwdrivers);
    console.log('Filtered screwdrivers:', filteredScrewdrivers);
    displayScrewdrivers(filteredScrewdrivers);
}

// Event listeners for filter buttons
document.addEventListener('DOMContentLoaded', function() {
    // Filter button click handlers
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', function() {
            // Update active state of buttons
            document.querySelectorAll('[data-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // Update filter and refresh table
            currentFilter = this.dataset.filter;
            console.log('Filter changed to:', currentFilter);
            loadScrewdrivers();
        });
    });

    // Search input handler
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentSearch = this.value;
            console.log('Search changed to:', currentSearch);
            loadScrewdrivers();
        });
    }
});

// Modify loadScrewdrivers function to use filtering
async function loadScrewdrivers() {
    try {
        const response = await fetch('http://localhost:3000/api/screwdrivers?include_inactive=true');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Schraubendreher');
        }
        const screwdrivers = await response.json();
        console.log('Loaded screwdrivers:', screwdrivers);
        updateTableWithFilteredData(screwdrivers);
    } catch (error) {
        console.error('Fehler:', error);
        showError('Fehler beim Laden der Schraubendreher');
    }
}

let currentEditId = null;

// Schraubendreher bearbeiten
async function editScrewdriver(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/screwdrivers/${id}`);
        if (!response.ok) {
            throw new Error('Fehler beim Laden des Schraubendrehers');
        }
        const screwdriver = await response.json();
        
        // Fill form fields
        document.getElementById('editName').value = screwdriver.name;
        document.getElementById('editDescription').value = screwdriver.description || '';
        
        // Store the ID for later use
        document.getElementById('saveEditButton').dataset.screwdriverId = id;
        
        // Fill attribute values
        const attributesContainer = document.getElementById('editAttributesContainer');
        attributesContainer.innerHTML = ''; // Clear existing fields
        
        // Handle both old and new data structures
        const attributes = screwdriver.Attributes || screwdriver.attributes || [];
        
        attributes.forEach(attribute => {
            const value = attribute.ScrewdriverAttribute ? 
                         attribute.ScrewdriverAttribute.value : 
                         attribute.value;

            const div = document.createElement('div');
            div.className = 'mb-3';
            
            const inputType = getInputType(attribute.data_type);
            const isRequired = attribute.is_required;
            
            // Handle date value conversion
            let displayValue = value || '';
            if (attribute.data_type === 'date' && value) {
                // Convert DD/MM/YYYY to YYYY-MM-DD for the input
                const [day, month, year] = value.split('/');
                if (day && month && year) {
                    displayValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }
            
            div.innerHTML = `
                <label for="edit_attr_${attribute.id}" class="form-label">
                    ${attribute.name}${isRequired ? '*' : ''}
                    ${attribute.description ? `
                        <i class="bi bi-info-circle ms-1" 
                           data-bs-toggle="tooltip" 
                           title="${attribute.description}"></i>
                    ` : ''}
                </label>
                ${inputType === 'checkbox' ? `
                    <div class="form-check">
                        <input type="${inputType}" 
                               class="form-check-input" 
                               id="edit_attr_${attribute.id}"
                               name="attr_${attribute.id}"
                               ${value === 'true' ? 'checked' : ''}
                               ${isRequired ? 'required' : ''}>
                    </div>
                ` : `
                    <input type="${inputType}" 
                           class="form-control" 
                           id="edit_attr_${attribute.id}"
                           name="attr_${attribute.id}"
                           value="${displayValue}"
                           ${inputType === 'date' ? 'min="1995-01-01" max="2050-12-31"' : ''}
                           ${isRequired ? 'required' : ''}>
                `}
                <div class="invalid-feedback">
                    ${attribute.data_type === 'date' ? 'Das Datum muss zwischen 1995 und 2050 liegen' : 'Dieses Feld ist erforderlich'}
                </div>
            `;
            
            attributesContainer.appendChild(div);
        });
        
        // Initialize tooltips
        const tooltips = [].slice.call(attributesContainer.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(el => new bootstrap.Tooltip(el));
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editScrewdriverModal'));
        modal.show();
    } catch (error) {
        showError('Fehler beim Laden der Schraubendreher-Daten: ' + error.message);
    }
}

async function submitEditForm() {
    try {
        const form = document.getElementById('editScrewdriverForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const id = document.getElementById('saveEditButton').dataset.screwdriverId;
        const attributeValues = [];
        const inputs = document.querySelectorAll('#editAttributesContainer input');
        
        inputs.forEach(input => {
            const attrId = input.id.replace('edit_attr_', '');
            let value = input.type === 'checkbox' ? input.checked.toString() : input.value;
            
            attributeValues.push({
                attributeId: parseInt(attrId),
                value: value
            });
        });

        const data = {
            name: document.getElementById('editName').value,
            description: document.getElementById('editDescription').value,
            attributes: attributeValues
        };

        const response = await fetch(`http://localhost:3000/api/screwdrivers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fehler beim Aktualisieren des Schraubendrehers');
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('editScrewdriverModal')).hide();
        await loadScrewdrivers();
        showSuccess('Schraubendreher erfolgreich aktualisiert');
    } catch (error) {
        showError('Fehler beim Speichern der Änderungen: ' + error.message);
    }
}

function getInputType(attributeType) {
    switch (attributeType) {
        case 'number':
            return 'number';
        case 'date':
            return 'date';
        case 'boolean':
            return 'checkbox';
        default:
            return 'text';
    }
}

// Status ändern
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

// Function to display screwdrivers in the table
async function displayScrewdrivers(screwdrivers) {
    try {
        // First, get all active attributes to create the table headers
        const attributesResponse = await fetch('http://localhost:3000/api/attributes');
        if (!attributesResponse.ok) {
            throw new Error('Fehler beim Laden der Attribute');
        }
        const allAttributes = await attributesResponse.json();
        const activeAttributes = allAttributes.filter(attr => attr.state === 'on');

        // Create table header if it doesn't exist
        const tableHeader = document.querySelector('#screwdriversTable thead');
        if (tableHeader) {
            tableHeader.innerHTML = `
                <tr>
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
                    <td colspan="${4 + activeAttributes.length}" class="text-center py-4">
                        <i class="bi bi-info-circle me-2"></i>
                        Keine Schraubendreher gefunden
                    </td>
                </tr>`;
            return;
        }
        
        tableBody.innerHTML = screwdrivers.map(screwdriver => `
            <tr>
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
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-btn" data-id="${screwdriver.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-${screwdriver.state === 'on' ? 'danger' : 'success'} toggle-btn" 
                                data-id="${screwdriver.id}"
                                data-new-state="${screwdriver.state === 'on' ? 'off' : 'on'}">
                            <i class="bi bi-${screwdriver.state === 'on' ? 'x-circle' : 'check-circle'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Initialize tooltips
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(el => new bootstrap.Tooltip(el));

        // Add event listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                editScrewdriver(button.dataset.id);
            });
        });

        document.querySelectorAll('.toggle-btn').forEach(button => {
            button.addEventListener('click', () => {
                toggleScrewdriverState(button.dataset.id, button.dataset.newState);
            });
        });
        
    } catch (error) {
        console.error('Fehler beim Anzeigen der Schraubendreher:', error);
        const tableBody = document.getElementById('screwdriversTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        Fehler beim Laden der Schraubendreher: ${error.message}
                    </td>
                </tr>`;
        }
    }
} 