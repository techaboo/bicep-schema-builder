// Main application script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Bicep Schema Builder loaded');
    
    // Initialize the application
    init();
});

// Global variables
let schemaParser;
let currentSchema = null;

function init() {
    // Initialize schema parser
    schemaParser = new SchemaParser();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ Application initialized');
}

function setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('schemaFile');
    fileInput.addEventListener('change', handleFileUpload);
    
    // Editor buttons
    document.getElementById('validateBtn').addEventListener('click', validateSchema);
    document.getElementById('formatBtn').addEventListener('click', formatJSON);
    document.getElementById('downloadBtn').addEventListener('click', downloadSchema);
    
    // Template buttons
    const templateButtons = document.querySelectorAll('.template-btn');
    templateButtons.forEach(btn => {
        btn.addEventListener('click', (e) => loadTemplate(e.target.dataset.template));
    });
    
    // Editor real-time validation
    const editor = document.getElementById('schemaEditor');
    editor.addEventListener('input', debounce(validateSchemaRealTime, 1000));
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showLoading('Loading schema...');
        const schema = await schemaParser.loadSchemaFromFile(file);
        currentSchema = schema;
        
        // Display in editor
        document.getElementById('schemaEditor').value = JSON.stringify(schema, null, 2);
        
        // Validate automatically
        validateSchema();
        
        showSuccess(`✅ Schema "${file.name}" loaded successfully!`);
    } catch (error) {
        showError(`❌ Error loading file: ${error.message}`);
    }
}

function validateSchema() {
    const editorContent = document.getElementById('schemaEditor').value.trim();
    
    if (!editorContent) {
        showError('❌ Please provide a schema to validate');
        return;
    }
    
    try {
        showLoading('Validating schema...');
        
        const schema = schemaParser.parseSchema(editorContent);
        currentSchema = schema;
        
        // Perform validation checks
        const validationResults = performDetailedValidation(schema);
        
        if (validationResults.isValid) {
            showValidationSuccess(validationResults);
        } else {
            showValidationErrors(validationResults);
        }
        
    } catch (error) {
        showError(`❌ Validation failed: ${error.message}`);
    }
}

function validateSchemaRealTime() {
    const editorContent = document.getElementById('schemaEditor').value.trim();
    if (!editorContent) return;
    
    try {
        JSON.parse(editorContent);
        // If we get here, JSON is valid
        document.getElementById('schemaEditor').style.borderColor = '#28a745';
    } catch (error) {
        document.getElementById('schemaEditor').style.borderColor = '#dc3545';
    }
}

function performDetailedValidation(schema) {
    const results = {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
    };
    
    // Check for required top-level properties
    if (!schema.$schema) {
        results.warnings.push('Missing $schema property - recommended for JSON Schema validation');
    }
    
    if (!schema.type) {
        results.errors.push('Missing required "type" property');
        results.isValid = false;
    }
    
    if (!schema.title && !schema.description) {
        results.warnings.push('Consider adding title or description for better documentation');
    }
    
    // Check for Bicep-specific patterns
    if (schema.properties) {
        checkBicepProperties(schema.properties, results);
    }
    
    // Add info about schema
    results.info.push(`Schema type: ${schema.type || 'unknown'}`);
    if (schema.properties) {
        results.info.push(`Properties defined: ${Object.keys(schema.properties).length}`);
    }
    
    return results;
}

function checkBicepProperties(properties, results) {
    const bicepProperties = ['apiVersion', 'type', 'name', 'location', 'properties'];
    const foundBicepProps = bicepProperties.filter(prop => properties[prop]);
    
    if (foundBicepProps.length > 0) {
        results.info.push(`Bicep properties detected: ${foundBicepProps.join(', ')}`);
    }
    
    // Check for common Azure resource patterns
    if (properties.apiVersion && !properties.apiVersion.enum && !properties.apiVersion.pattern) {
        results.warnings.push('apiVersion should specify allowed values with enum or pattern');
    }
    
    if (properties.name && !properties.name.pattern && !properties.name.minLength) {
        results.warnings.push('Consider adding validation pattern for resource name');
    }
}

function formatJSON() {
    const editor = document.getElementById('schemaEditor');
    const content = editor.value.trim();
    
    if (!content) {
        showError('❌ No content to format');
        return;
    }
    
    try {
        const parsed = JSON.parse(content);
        editor.value = JSON.stringify(parsed, null, 2);
        showSuccess('✅ JSON formatted successfully!');
    } catch (error) {
        showError(`❌ Cannot format invalid JSON: ${error.message}`);
    }
}

function downloadSchema() {
    const content = document.getElementById('schemaEditor').value.trim();
    
    if (!content) {
        showError('❌ No schema to download');
        return;
    }
    
    try {
        // Validate JSON before download
        JSON.parse(content);
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bicep-schema.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('✅ Schema downloaded successfully!');
    } catch (error) {
        showError(`❌ Cannot download invalid JSON: ${error.message}`);
    }
}

function loadTemplate(templateName) {
    const templates = {
        storage: 'schemas/storageAccount.json',
        webapp: 'schemas/webApp.json',
        vm: 'schemas/virtualMachine.json',
        keyvault: 'schemas/keyVault.json'
    };
    
    const templatePath = templates[templateName];
    if (!templatePath) {
        showError(`❌ Template "${templateName}" not found`);
        return;
    }
    
    // Load template from file
    fetch(templatePath)
        .then(response => response.json())
        .then(schema => {
            document.getElementById('schemaEditor').value = JSON.stringify(schema, null, 2);
            validateSchema();
            showSuccess(`✅ Loaded ${templateName} template`);
        })
        .catch(error => {
            // Fallback to inline template
            const fallbackTemplate = createFallbackTemplate(templateName);
            document.getElementById('schemaEditor').value = JSON.stringify(fallbackTemplate, null, 2);
            validateSchema();
            showSuccess(`✅ Loaded ${templateName} template (fallback)`);
        });
}

function createFallbackTemplate(templateName) {
    const baseTemplate = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "title": `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Schema`,
        "properties": {
            "apiVersion": { "type": "string" },
            "type": { "type": "string" },
            "name": { "type": "string" },
            "location": { "type": "string" }
        },
        "required": ["apiVersion", "type", "name"]
    };
    
    return baseTemplate;
}

// Utility functions
function showLoading(message) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel';
    output.textContent = `⏳ ${message}`;
}

function showSuccess(message) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel success';
    output.textContent = message;
    
    setTimeout(() => {
        if (output.textContent === message) {
            output.className = 'output-panel';
            output.innerHTML = '<p class="placeholder">Ready for next validation...</p>';
        }
    }, 3000);
}

function showError(message) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel error';
    output.textContent = message;
}

function showValidationSuccess(results) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel success';
    
    let message = '✅ Schema is valid!\n\n';
    
    if (results.info.length > 0) {
        message += 'ℹ️ Information:\n' + results.info.map(info => `  • ${info}`).join('\n') + '\n\n';
    }
    
    if (results.warnings.length > 0) {
        message += '⚠️ Warnings:\n' + results.warnings.map(warning => `  • ${warning}`).join('\n');
    }
    
    output.textContent = message;
}

function showValidationErrors(results) {
    const output = document.getElementById('validationOutput');
    output.className = 'output-panel error';
    
    let message = '❌ Schema validation failed!\n\n';
    
    if (results.errors.length > 0) {
        message += '🚨 Errors:\n' + results.errors.map(error => `  • ${error}`).join('\n') + '\n\n';
    }
    
    if (results.warnings.length > 0) {
        message += '⚠️ Warnings:\n' + results.warnings.map(warning => `  • ${warning}`).join('\n');
    }
    
    output.textContent = message;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add some helper functions for enhanced functionality
function exportSchemaAsTypeScript() {
    // Future enhancement: convert JSON schema to TypeScript interfaces
    console.log('TypeScript export feature - coming soon!');
}

function generateBicepFromSchema() {
    // Future enhancement: generate Bicep template from schema
    console.log('Bicep generation feature - coming soon!');
}